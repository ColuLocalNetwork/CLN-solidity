pragma solidity ^0.4.18;

import '../Standard677Token.sol';

contract Standard677TokenMock is Standard677Token {
    function assign(address _account, uint _balance) public {
        balances[_account] = _balance;
    }
}
