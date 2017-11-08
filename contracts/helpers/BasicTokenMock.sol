pragma solidity 0.4.18;

import '../BasicToken.sol';

contract BasicTokenMock is BasicToken {
    function assign(address _account, uint _balance) public {
        balances[_account] = _balance;
    }
}