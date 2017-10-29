pragma solidity 0.4.18;

import '../UpgradeAgent.sol';
import '../Ownable.sol';
import './BasicTokenMock.sol';

contract UpgradeAgentMock is UpgradeAgent, BasicTokenMock {

    BasicTokenMock public lastToken;

    modifier fromLastToken() {
      if (lastToken != msg.sender) {
        revert();
      }

      _;
    }

    function UpgradeAgentMock(address _lastToken, uint256 _originalSupply) {
      lastToken = BasicTokenMock(_lastToken);
      originalSupply = _originalSupply;
    }

    function upgradeFrom(address _from, uint256 _value) public fromLastToken {
      balances[_from] = balances[_from].add(_value);
    }
}