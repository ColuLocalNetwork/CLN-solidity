pragma solidity 0.4.18;

import './SafeMath.sol';
import './MarketMaker.sol';
import './ERC223.sol';
import './TokenOwnable.sol';

contract EllipseMarketMaker is MarketMaker, TokenOwnable{
    using SafeMath for uint256;

    uint256 public constant precision = 10 ** 6;

    ERC223 public token1;
    ERC223 public token2;

    uint256 public R1;
    uint256 public R2;

    uint256 public S1;
    uint256 public S2;

    bool public operational;

    bool public bootstrap;

    modifier isOperational() {
      require(operational);
      _;
    }

    modifier notOperational() {
      require(!operational);
      _;
    }

    modifier canTrade() {
      require(!bootstrap || msg.sender == owner);
      _;
    }

    modifier canTrade223() {
      require (!bootstrap || tkn.sender == owner);
      _;
    }

    function EllipseMarketMaker(address _token1, address _token2) public {
      require(_token1 != address(0));
      require(_token2 != address(0));
      token1 = ERC223(_token1);
      token2 = ERC223(_token2);
      R1 = 0;
      R2 = 0;
      S1 = token1.totalSupply();
      S2 = token2.totalSupply();

      operational = false;
      bootstrap = true;
    }

    function endBootstrap() public onlyOwner isOperational {
      bootstrap = false;
    }

    function supportsToken(address token) public constant returns (bool) {
        return (token1 == token || token2 == token);
    }

    function initializeAfterTransfer() public notOperational onlyOwner returns (bool) {
      return initialize();
    }

    function initializeOnTransfer() public notOperational tokenOnlyOwner tokenPayable returns (bool) {
      return initialize();
    }

    function initialize() private returns (bool success) {
      R1 = token1.balanceOf(this);
      R2 = token2.balanceOf(this);
      success = ((R1 == 0 && R2 == S2) || (R2 == 0 && R1 == S1));
      if (success) {
        operational = true;
      }
    }

    function getPrice() public constant isOperational returns (uint256 price) {
      return precision
      .mul(S1.sub(R1))
      .mul(S2)
      .mul(S2)
      .div(S2.sub(R2))
      .div(S1)
      .div(S1);
    }

    function quote(address _fromToken, address _toToken, uint256 _inAmount) public constant isOperational returns (uint256 returnAmount) {
      uint256 _R1;
      uint256 _S1;
      uint256 _S2;
      
      if (token1 == _fromToken && token2 == _toToken) {
        _R1 = R1;
        _S1 = S1;
        _S2 = S2;
      } else if (token2 == _fromToken && token1 == _toToken) {
        _R1 = R2;
        _S1 = S2;
        _S2 = S1;
      } else {
        return 0;
      }
      
      uint256 firstRoot = precision
        .mul(precision)
        .sub(
          precision
          .mul(
            _S1
            .sub(_R1)
            .sub(_inAmount)
          )
          .div(_S1)
          .toPower2()
        )
        .sqrt();
      
      uint256 secondRoot = precision
        .mul(precision)
        .sub(
          precision
          .mul(
            _S1
            .sub(_R1)
          )
          .div(_S1)
          .toPower2()
        )
        .sqrt();
      
      returnAmount = _S2.mul(firstRoot.sub(secondRoot)).div(precision);
    }

    function changeAllowance(address _fromToken, address _toToken, uint256 _inAmount) public canTrade returns (uint256 returnAmount) {
      return changeAllowance(_fromToken, _toToken, _inAmount, 0);
    }

    function changeAllowance(address _fromToken, address _toToken, uint256 _inAmount, uint256 _minReturn) public canTrade returns (uint256 returnAmount) {
      require(ERC223(_fromToken).transferFrom(msg.sender, this, _inAmount));
      returnAmount = change(_fromToken, _toToken, _inAmount, _minReturn);
      if (returnAmount == 0) {
        revert();
      }
      ERC223(_toToken).transfer(msg.sender, returnAmount);
      require(validateReserves());
      Change(_fromToken, _inAmount, _toToken, returnAmount, msg.sender);
    }

    function change223(address _fromToken, address _toToken) public canTrade223 tokenPayable returns (uint256 returnAmount) {
      require(tkn.addr == _fromToken);
      return change223(_fromToken, _toToken, 0);
    }

    function change223(address _fromToken, address _toToken, uint256 _minReturn) public canTrade223 tokenPayable returns (uint256 returnAmount) {
      require(tkn.addr == _fromToken);
      returnAmount = change(_fromToken, _toToken, tkn.value, _minReturn);
      if (returnAmount == 0) {
        revert();
      }
      ERC223(_toToken).transfer(tkn.sender, returnAmount);
      require(validateReserves());
      Change(_fromToken, tkn.value, _toToken, returnAmount, tkn.sender);
    }

    function change(address _fromToken, address _toToken, uint256 _inAmount, uint256 _minReturn) private returns (uint256 returnAmount) {
      returnAmount = quote(_fromToken, _toToken, _inAmount);
      if (returnAmount == 0 || returnAmount < _minReturn) {
        return 0;
      } 
      updateReserve(_fromToken, _inAmount, true);
      updateReserve(_toToken, returnAmount, false);
    }

    function updateReserve(address _token, uint256 _amount, bool _add) private {
      if (token1 == _token) {
        if (_add) {
          R1 = R1.add(_amount);
        } else {
          R1 = R1.sub(_amount);
        }
      }
      if (token2 == _token) {
        if (_add) {
          R2 = R2.add(_amount);
        } else {
          R2 = R2.sub(_amount);
        }
      }
    }

    function validateReserves() public view returns (bool) {
      return (token1.balanceOf(this) >= R1 && token2.balanceOf(this) >= R2);
    }

    function withdrawExcessReserves() public onlyOwner {
      if (token1.balanceOf(this) > R1) {
        token1.transfer(msg.sender, token1.balanceOf(this).sub(R1));
      }
      if (token2.balanceOf(this) > R2) {
        token2.transfer(msg.sender, token2.balanceOf(this).sub(R2));
      }
    }
}
