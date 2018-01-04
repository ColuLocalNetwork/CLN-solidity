pragma solidity 0.4.18;

 /* Standard ERC223 Token Receiver implementing tokenFallback function and tokenPayable modifier */

import './ERC223Receiver.sol';

contract Standard223Receiver is ERC223Receiver {
  Tkn tkn;

  struct Tkn {
    address addr;
    address sender; // the transaction caller
    address origin; // the tokens origin
    uint256 value;
  }

  function tokenFallback(address _sender, address _origin, uint _value, bytes _data) external returns (bool ok) {
    if (!supportsToken(msg.sender)) return false;

    // Problem: This will do a sstore which is expensive gas wise. Find a way to keep it in memory.
    // Solution: Remove the the data 
    tkn = Tkn(msg.sender, _sender, _origin, _value);
    __isTokenFallback = true;
    if (!address(this).delegatecall(_data)) {
      __isTokenFallback = false;
      return false;
    }
    // avoid doing an overwrite to .token, which would be more expensive
    // makes accessing .tkn values outside tokenPayable functions unsafe
    __isTokenFallback = false;

    return true;
  }

  bool __isTokenFallback;

  modifier tokenPayable {
    require(__isTokenFallback);
    _;
  }

  function supportsToken(address token) public constant returns (bool);
}