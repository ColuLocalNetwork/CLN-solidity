pragma solidity 0.4.18;

/// @title ERC223Receiver Interface
/// @dev Based on the specs form: https://github.com/ethereum/EIPs/issues/223
contract ERC223Receiver {
    function tokenFallback(address _sender, uint _value, bytes _data) external returns (bool ok);
}