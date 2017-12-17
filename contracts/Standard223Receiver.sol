pragma solidity ^0.4.8;

 /* Standard ERC223 Token Receiver implementing tokenFallback function and tokenPayable modifier */

import "./ERC223Receiver.sol";

contract Standard223Receiver is ERC223Receiver {
  Tkn tkn;

  struct Tkn {
    address addr;
    address sender; // the transaction caller
    address origin; // the tokens origin
    uint256 value;
    bytes data;
    bytes4 sig;
  }

  function tokenFallback(address _sender, address _origin, uint _value, bytes _data) external returns (bool ok) {
    if (!supportsToken(msg.sender)) return false;

    // Problem: This will do a sstore which is expensive gas wise. Find a way to keep it in memory.
    tkn = Tkn(msg.sender, _sender, _origin, _value, _data, getSig(_data));
    __isTokenFallback = true;
    if (!address(this).delegatecall(_data)) return false;

    // avoid doing an overwrite to .token, which would be more expensive
    // makes accessing .tkn values outside tokenPayable functions unsafe
    __isTokenFallback = false;

    return true;
  }

  function getSig(bytes _data) private pure returns (bytes4 sig) {
    uint l = _data.length < 4 ? _data.length : 4;
    for (uint i = 0; i < l; i++) {
      sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (l - 1 - i))));
    }
  }

  bool __isTokenFallback;

  modifier tokenPayable {
    require(__isTokenFallback);
    _;
  }

  function supportsToken(address token) public constant returns (bool);
}