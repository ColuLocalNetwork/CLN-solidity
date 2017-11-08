pragma solidity 0.4.18;

import '../UpgradeableToken.sol';

contract UpgradeableTokenMock is UpgradeableToken {
    function assign(address _account, uint _balance) public {
        balances[_account] = _balance;
        totalSupply = totalSupply.add(_balance);
    }
}