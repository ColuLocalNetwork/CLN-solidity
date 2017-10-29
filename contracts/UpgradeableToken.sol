pragma solidity 0.4.18;

import './SafeMath.sol';
import './Ownable.sol';
import './BasicToken.sol';
import './UpgradeAgent.sol';

/// @title A token upgrade mechanism where users can opt-in amount of tokens to the next smart contract revision.
/// @dev First envisioned by Golem, Lunyr and Storj projects.
contract UpgradeableToken is Ownable, BasicToken {
  using SafeMath for uint256;

  // The next contract where the tokens will be migrated.
  UpgradeAgent public upgradeAgent;

  // How many tokens we have upgraded by now.
  uint256 public totalUpgraded;

  
  // Upgrade states.
 
  // - NotAllowed: The child contract has not reached a condition where the upgrade can bgun
  // - WaitingForAgent: Token allows upgrade, but we don't have a new agent yet
  // - ReadyToUpgrade: The agent is set, but not a single token has been upgraded yet
  // - Upgrading: Upgrade agent is set and the balance holders can upgrade their tokens  
  enum UpgradeState {Unknown, NotAllowed, WaitingForAgent, ReadyToUpgrade, Upgrading}

  // Somebody has upgraded some of his tokens.
  event Upgrade(address indexed from, address indexed to, uint256 value);

  // New upgrade agent available.
  event UpgradeAgentSet(address agent);

  // @dev Reverts if UpgradeState is deferent than ReadyToUpgrade or Upgrading
  modifier upgradeReady() {
    UpgradeState state = getUpgradeState();
    if(!(state == UpgradeState.ReadyToUpgrade || state == UpgradeState.Upgrading)) {
      // Called in a bad state
      revert();
    }

    _;
  }

  /// @dev Allow the token holder to upgrade some of their tokens to a new contract.
  /// @param _value The amount to upgrade.
  function upgrade(uint256 _value) public upgradeReady {
      // Validate input _value.
      if (_value == 0) revert();

      balances[msg.sender] = balances[msg.sender].sub(_value);

      // Take tokens out from circulation
      totalSupply = totalSupply.sub(_value);
      totalUpgraded = totalUpgraded.add(_value);

      // Upgrade agent reissues the tokens
      upgradeAgent.upgradeFrom(msg.sender, _value);
      Upgrade(msg.sender, upgradeAgent, _value);
  }

  /// @dev Set an upgrade agent.
  /// @param _upgradeAgent the new token or upgrade agent contract.
  function setUpgradeAgent(address _upgradeAgent) external onlyOwner {
      // The token is not yet in a state that we could think upgrading
      if(!canUpgrade()) revert();

      // Bad agent
      if (_upgradeAgent == 0x0) revert();
      
      // Upgrade has already begun for an agent
      if (getUpgradeState() == UpgradeState.Upgrading) revert();

      upgradeAgent = UpgradeAgent(_upgradeAgent);

      // Bad interface
      if(!upgradeAgent.isUpgradeAgent()) revert();
      
      // Make sure that token supplies match in source and target
      if (upgradeAgent.originalSupply() != totalSupply) revert();

      UpgradeAgentSet(upgradeAgent);
  }

  /// @dev Get the state of the token upgrade.
  function getUpgradeState() public constant returns(UpgradeState) {
    if(!canUpgrade()) return UpgradeState.NotAllowed;
    else if(address(upgradeAgent) == 0x00) return UpgradeState.WaitingForAgent;
    else if(totalUpgraded == 0) return UpgradeState.ReadyToUpgrade;
    else return UpgradeState.Upgrading;
  }

  /// @dev Child contract can enable to provide the condition when the upgrade can begun.
  function canUpgrade() public constant returns(bool) {
     return true;
  }

}