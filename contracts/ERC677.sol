pragma solidity 0.4.18;

import "./ERC20.sol";

/// @title ERC Token Standard #677 Interface (https://github.com/ethereum/EIPs/issues/677)
contract ERC677 is ERC20 {
    function transferAndCall(address receiver, uint amount, bytes data) public returns (bool success);
}