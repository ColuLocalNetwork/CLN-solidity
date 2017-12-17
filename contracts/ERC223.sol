pragma solidity 0.4.18;

import "./ERC20.sol";

 /*
  ERC223 additions to ERC20

  Interface wise is ERC20 + data paramenter to transfer and transferFrom.
 */

/// @title ERC Token Standard #677 Interface (https://github.com/ethereum/EIPs/issues/677)
contract ERC223 is ERC20 {
    function transfer(address to, uint value, bytes data) returns (bool ok);
    function transferFrom(address from, address to, uint value, bytes data) returns (bool ok);

    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}