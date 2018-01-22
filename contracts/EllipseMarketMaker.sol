pragma solidity 0.4.18;

import './ERC20.sol';
import './MarketMaker.sol';
import './TokenOwnable.sol';

contract EllipseMarketMaker is MarketMaker, TokenOwnable {
    uint256 public constant precision = 2 ** 127;

    ERC20 public token1;
    ERC20 public token2;

    uint256 public R1;
    uint256 public R2;

    uint256 public S1;
    uint256 public S2;

    bool public operational;
    bool public bootstrap;

    address public mmLib;

    function EllipseMarketMaker(address _mmLib, address _token1, address _token2) public {
      require(_mmLib != address(0));
      // Signature of the mmLib's constructor function
      // bytes4 sig = bytes4(keccak256("constructor(address,address,address)"));
      bytes4 sig = 0x6dd23b5b;

      // 3 arguments of size 32
      uint256 argsSize = 3 * 32;
      // sig + arguments size
      uint256 dataSize = 4 + argsSize;

      bytes memory m_data = new bytes(dataSize);

      assembly {
          // Add the signature first to memory
          mstore(add(m_data, 0x20), sig)
          // Add the parameters
          mstore(add(m_data, 0x24), _mmLib)
          mstore(add(m_data, 0x44), _token1)
          mstore(add(m_data, 0x64), _token2)
      }

      require(_mmLib.delegatecall(m_data));
    }

    function supportsToken(address token) public constant returns (bool) {
        return (token1 == token || token2 == token);
    }

    function getPrice() public constant returns (uint256) {
      return delegateWithReturn(32);
    }

    function quote(address _fromToken, uint256 _inAmount, address _toToken) public constant returns (uint256) {
      return delegateWithReturn(32);
    }

    function calcReserve(uint256 _R1, uint256 _S1, uint256 _S2) public constant returns (uint256) {
      return delegateWithReturn(32);
    }

    function roundTripDiff(uint256 _R1) public constant returns (uint256) {
      return delegateWithReturn(32);
    }

    function validateReserves() public constant returns (bool) {
      return (token1.balanceOf(this) >= R1 && token2.balanceOf(this) >= R2);
    }

    function change(address _fromToken, uint256 _amount, address _toToken) public returns (uint256) {
      return delegateWithReturn(32);
    }
    
    function change(address _fromToken, uint256 _amount, address _toToken, uint256 _minReturn) public returns (uint256) {
      return delegateWithReturn(32);
    }
    
    function change(address _toToken) public returns (uint256) {
      return delegateWithReturn(32);
    }
    
    function change(address _toToken, uint256 _minReturn) public returns (uint256) {
      return delegateWithReturn(32);
    }

    function withdrawExcessReserves() public returns (uint256) {
      return delegateWithReturn(32);
    }

    function endBootstrap() public returns (bool) {
      return delegateWithReturn(1) == 1;
    }

    function initializeAfterTransfer() public returns (bool) {
      return delegateWithReturn(1) == 1;
    }

    function initializeOnTransfer() public returns (bool) {
      return delegateWithReturn(1) == 1;
    }

    // function supportsToken(address token) public constant returns (bool) {
    //     return (token1 == token || token2 == token);
    // }

    function delegateWithReturn(uint256 _returnSize) private constant returns (uint256) {
      address _mmLib = mmLib;
      if (msg.data.length > 0) {
        assembly {
          calldatacopy(0xff, 0, calldatasize)
          let retVal := delegatecall(gas, _mmLib, 0xff, calldatasize, 0, _returnSize)
          switch retVal case 0 { revert(0,0) } default { return(0, _returnSize) }
        }
      }
    }

    // gets called when no other function matches
    function() public {
      Debug('fallback', msg.data);
      if (msg.data.length > 0)
        mmLib.delegatecall(msg.data);
    }
}
