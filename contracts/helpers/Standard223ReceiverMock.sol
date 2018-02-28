pragma solidity ^0.4.18;

import '../Standard223Receiver.sol';

contract Standard223ReceiverMock is Standard223Receiver {
    address public tokenSender;
    uint public tokenValue;
    bool public calledFallback = false;

    function () tokenPayable external {
      tokenSender = tkn.sender;
      tokenValue = tkn.value;
      calledFallback = true;
    }

    function supportsToken(address token) public constant returns (bool) {
      return (token != address(0));
    }
}