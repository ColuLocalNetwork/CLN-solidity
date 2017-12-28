pragma solidity 0.4.18;

import '../Standard223Token.sol';

contract Standard223TokenMock is Standard223Token {
    function assign(address _account, uint _balance) public {
        balances[_account] = _balance;
    }
}