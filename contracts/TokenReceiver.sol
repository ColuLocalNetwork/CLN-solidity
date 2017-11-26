pragma solidity 0.4.18;

contract TokenReceiver {
    function tokenFallback(address from, uint256 amount, bytes data) external returns (bool success);
}