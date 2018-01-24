pragma solidity 0.4.18;

import './SafeMath.sol';
import './IEllipseMarketMaker.sol';
import './ERC20.sol';
import './TokenOwnable.sol';

/// @title Ellipse Market Maker Library.
/// @dev market maker, using ellipse equation.
/// @dev for more information read the appendix of the CLN white paper: https://cln.network/pdf/cln_whitepaper.pdf
/// @author Tal Beja.
contract EllipseMarketMakerLib is TokenOwnable, IEllipseMarketMaker {
  using SafeMath for uint256;

  // temp reserves
  uint256 private l_R1;
  uint256 private l_R2;

  /// @dev Reverts if not operational
  modifier isOperational() {
    require(operational);
    _;
  }

  /// @dev Reverts if operational
  modifier notOperational() {
    require(!operational);
    _;
  }

  /// @dev Reverts if msg.sender can't trade
  modifier canTrade() {
    require(openForPublic || msg.sender == owner);
    _;
  }

  /// @dev Reverts if tkn.sender can't trade
  modifier canTrade223() {
    require (openForPublic || tkn.sender == owner);
    _;
  }

  /// @dev The Market Maker constructor
  function constructor(address _mmLib, address _token1, address _token2) public returns (bool) {
    require(_mmLib != address(0));
    require(_token1 != address(0));
    require(_token2 != address(0));
    require(_token1 != _token2);

    mmLib = _mmLib;
    token1 = ERC20(_token1);
    token2 = ERC20(_token2);
    R1 = 0;
    R2 = 0;
    S1 = token1.totalSupply();
    S2 = token2.totalSupply();

    operational = false;
    openForPublic = false;

    return true;
  }

  /// @dev open the Market Maker for public trade.
  function openForPublicTrade() public onlyOwner isOperational returns (bool) {
    openForPublic = true;
    return true;
  }

  /// @dev returns true iff the contract is open for public trade.
  function isOpenForPublic() public onlyOwner returns (bool) {
    return (openForPublic && operational);
  }

  /// @dev returns true iff token is supperted by this contract (for erc223/677 tokens calls)
  /// @param _token can be token1 or token2
  function supportsToken(address _token) public constant returns (bool) {
      return (token1 == _token || token2 == _token);
  }

  /// @dev initialize the contract after transfering all of the tokens form the pair
  function initializeAfterTransfer() public notOperational onlyOwner returns (bool) {
    require(initialize());
    return true;
  }

  /// @dev initialize the contract during erc223/erc677 transfer of all of the tokens form the pair
  function initializeOnTransfer() public notOperational tokenOnlyOwner tokenPayable returns (bool) {
    require(initialize());
    return true;
  }

  /// @dev initialize the contract.
  function initialize() private returns (bool success) {
    R1 = token1.balanceOf(this);
    R2 = token2.balanceOf(this);
    // one reserve should be full and the second should be empty
    success = ((R1 == 0 && R2 == S2) || (R2 == 0 && R1 == S1));
    if (success) {
      operational = true;
    }
  }

  /// @dev the price pf token1 in terms of token2, represented in 18 decimals.
  function getPrice() public constant isOperational returns (uint256 price) {
    return PRECISION
      .mul(S1.sub(R1))
      .div(S2.sub(R2))
      .mul(S2)
      .div(S1)
      .mul(S2)
      .div(S1);
  }

  /// @dev get a quate for exchanging and update temporary reserves.
  /// @param _fromToken the token to sell from
  /// @param _inAmount the amount to sell
  /// @param _toToken the token to buy
  /// @return the return amount of the buying token 
  function quoteAndReserves(address _fromToken, uint256 _inAmount, address _toToken) private isOperational returns (uint256 returnAmount) {
    // if buying token2 from token1
    if (token1 == _fromToken && token2 == _toToken) {
      // add buying amount to the temp reserve
      l_R1 = R1.add(_inAmount);
      // calculate the other reserve
      l_R2 = calcReserve(l_R1, S1, S2);
      if (l_R2 > R2) {
        return 0;
      }
      // the returnAmount is the other reserve deference
      returnAmount = R2.sub(l_R2);
    } 
    // if buying token1 from token2
    else if (token2 == _fromToken && token1 == _toToken) {
      // add buying amount to the temp reserve
      l_R2 = R2.add(_inAmount);
      // calculate the other reserve
      l_R1 = calcReserve(l_R2, S2, S1);
      if (l_R1 > R1) {
        return 0;
      }
      // the returnAmount is the other reserve deference
      returnAmount = R1.sub(l_R1);
    } else {
      return 0;
    }
  }

  /// @dev get a quate for exchanging.
  /// @param _fromToken the token to sell from
  /// @param _inAmount the amount to sell
  /// @param _toToken the token to buy
  /// @return the return amount of the buying token
  function quote(address _fromToken, uint256 _inAmount, address _toToken) public constant isOperational returns (uint256 returnAmount) {
    uint256 _R1;
    uint256 _R2;
    // if buying token2 from token1
    if (token1 == _fromToken && token2 == _toToken) {
      // add buying amount to the temp reserve
      _R1 = R1.add(_inAmount);
      // calculate the other reserve
      _R2 = calcReserve(_R1, S1, S2);
      if (_R2 > R2) {
        return 0;
      }
      // the returnAmount is the other reserve deference
      returnAmount = R2.sub(_R2);
    }
    // if buying token1 from token2
    else if (token2 == _fromToken && token1 == _toToken) {
      // add buying amount to the temp reserve
      _R2 = R2.add(_inAmount);
      // calculate the other reserve
      _R1 = calcReserve(_R2, S2, S1);
      if (_R1 > R1) {
        return 0;
      }
      // the returnAmount is the other reserve deference
      returnAmount = R1.sub(_R1);
    } else {
      return 0;
    }
  }

  /// @dev calculate second reserve from the first reserve and the supllies.
  /// @dev the equation is simetric, so by replacing _S1 and _S2 and _R1 with _R2 we can calculate the first reserve from the second reserve
  /// @param _R1 the first reserve
  /// @param _S1 the first total supply
  /// @param _S2 the second total supply
  /// @return _R2 the second reserve
  function calcReserve(uint256 _R1, uint256 _S1, uint256 _S2) public pure returns (uint256 _R2) {
    _R2 = _S2
      .mul(
        _S1
        .sub(
          _R1
          .mul(_S1)
          .mul(2)
          .sub(
            _R1
            .toPower2()  
          )
          .sqrt()
        )
      )
      .div(_S1);
  }

  /// @dev change tokens.
  /// @param _fromToken the token to sell from
  /// @param _inAmount the amount to sell
  /// @param _toToken the token to buy
  /// @return the return amount of the buying token
  function change(address _fromToken, uint256 _inAmount, address _toToken) public canTrade returns (uint256 returnAmount) {
    return change(_fromToken, _inAmount, _toToken, 0);
  }

  /// @dev change tokens.
  /// @param _fromToken the token to sell from
  /// @param _inAmount the amount to sell
  /// @param _toToken the token to buy
  /// @param _minReturn the munimum token to buy
  /// @return the return amount of the buying token
  function change(address _fromToken, uint256 _inAmount, address _toToken, uint256 _minReturn) public canTrade returns (uint256 returnAmount) {
    // pull transfer the selling token
    require(ERC20(_fromToken).transferFrom(msg.sender, this, _inAmount));
    // exchange the token
    returnAmount = exchange(_fromToken, _inAmount, _toToken, _minReturn);
    if (returnAmount == 0) {
      // if no return value revert
      revert();
    }
    // transfer the buying token
    ERC20(_toToken).transfer(msg.sender, returnAmount);
    // validate the reserves
    require(validateReserves());
    Change(_fromToken, _inAmount, _toToken, returnAmount, msg.sender);
  }

  /// @dev change tokens using erc223\erc677 transfer.
  /// @param _toToken the token to buy
  /// @return the return amount of the buying token
  function change(address _toToken) public canTrade223 tokenPayable returns (uint256 returnAmount) {
    return change(_toToken, 0);
  }

  /// @dev change tokens using erc223\erc677 transfer.
  /// @param _toToken the token to buy
  /// @param _minReturn the munimum token to buy
  /// @return the return amount of the buying token
  function change(address _toToken, uint256 _minReturn) public canTrade223 tokenPayable returns (uint256 returnAmount) {
    // get from token and in amount from the tkn object
    address fromToken = tkn.addr;
    uint256 inAmount = tkn.value;
    // exchange the token
    returnAmount = exchange(fromToken, inAmount, _toToken, _minReturn);
    if (returnAmount == 0) {
      // if no return value revert
      revert();
    }
    // transfer the buying token
    ERC20(_toToken).transfer(tkn.sender, returnAmount);
    // validate the reserves
    require(validateReserves());
    Change(fromToken, inAmount, _toToken, returnAmount, tkn.sender);
  }

  /// @dev exchange tokens.
  /// @param _fromToken the token to sell from
  /// @param _inAmount the amount to sell
  /// @param _toToken the token to buy
  /// @param _minReturn the munimum token to buy
  /// @return the return amount of the buying token
  function exchange(address _fromToken, uint256 _inAmount, address _toToken, uint256 _minReturn) private returns (uint256 returnAmount) {
    // get quate and update temo reserves
    returnAmount = quoteAndReserves(_fromToken, _inAmount, _toToken);
    // if the return amount is lower than minimum return, don't buy
    if (returnAmount == 0 || returnAmount < _minReturn) {
      return 0;
    }

    // update reserves from temp values
    updateReserve();
  }

  /// @dev update token reserves from temp values
  function updateReserve() private {
    R1 = l_R1;
    R2 = l_R2;
  }

  /// @dev validate that the tokens balances don't goes below reserves
  function validateReserves() public view returns (bool) {
    return (token1.balanceOf(this) >= R1 && token2.balanceOf(this) >= R2);
  }

  /// @dev allow admin to withraw excess tokens accumolated due to precision
  function withdrawExcessReserves() public onlyOwner returns (uint256 returnAmount) {
    // if there is excess of token 1, transfer it to the owner
    if (token1.balanceOf(this) > R1) {
      returnAmount = returnAmount.add(token1.balanceOf(this).sub(R1));
      token1.transfer(msg.sender, token1.balanceOf(this).sub(R1));
    }
    // if there is excess of token 2, transfer it to the owner
    if (token2.balanceOf(this) > R2) {
      returnAmount = returnAmount.add(token2.balanceOf(this).sub(R2));
      token2.transfer(msg.sender, token2.balanceOf(this).sub(R2));
    }
  }
}
