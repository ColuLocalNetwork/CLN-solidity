pragma solidity 0.4.18;

import './ERC20.sol';
import './TokenOwnable.sol';

/// @title Ellipse Market Maker contract.
/// @dev market maker, using ellipse equation.
/// @author Tal Beja.
contract EllipseMarketMaker is TokenOwnable {

  // precision for price representation (as in ether or tokens).
  uint256 public constant PRECISION = 10 ** 18;

  // The tokens pair.
  ERC20 public token1;
  ERC20 public token2;

  // The tokens reserves.
  uint256 public R1;
  uint256 public R2;

  // The tokens full suplly.
  uint256 public S1;
  uint256 public S2;

  // State flags.
  bool public operational;
  bool public openForPublic;

  // Library contract address.
  address public mmLib;

  /// @dev Constructor calling the library contract using delegate.
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

    // delegatecall to the library contract
    require(_mmLib.delegatecall(m_data));
  }

  /// @dev returns true iff token is supperted by this contract (for erc223/677 tokens calls)
  /// @param token can be token1 or token2
  function supportsToken(address token) public constant returns (bool) {
    return (token1 == token || token2 == token);
  }

  /// @dev gets called when no other function matches, delegate to the lib contract.
  function() public {
    address _mmLib = mmLib;
    if (msg.data.length > 0) {
      assembly {
        calldatacopy(0xff, 0, calldatasize)
        let retVal := delegatecall(gas, _mmLib, 0xff, calldatasize, 0, 0x20)
        switch retVal case 0 { revert(0,0) } default { return(0, 0x20) }
      }
    }
  }
}
