pragma solidity 0.4.18;

contract ERC223Receiver {
    function tokenFallback(address sender, address origin, uint value, bytes data) external returns (bool ok);
}