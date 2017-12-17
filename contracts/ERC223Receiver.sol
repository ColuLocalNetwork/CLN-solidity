pragma solidity 0.4.18;

contract ERC223Receiver {
    function tokenFallback(address _sender, address _origin, uint _value, bytes _data) external returns (bool ok);
}