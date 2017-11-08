pragma solidity 0.4.18;

/// @title Upgrade agent interface inspired by Lunyr.
/// @dev Upgrade agent transfers tokens to a new contract.
/// @dev Upgrade agent itself can be the token contract, or just a middle man contract doing the heavy lifting.
contract UpgradeAgent {

  uint256 public originalSupply;

  /// @dev Interface marker.
  function isUpgradeAgent() public pure returns (bool) {
    return true;
  }

  function upgradeFrom(address _from, uint256 _value) public;

}