pragma solidity 0.4.18;

import './Ownable.sol';
import './Standard223Receiver.sol';

/// @title TokenOwnable
/// @dev The TokenOwnable contract adds a tokenOnlyOwner modifier as a tokenReciever with ownable addaptation

contract TokenOwnable is Standard223Receiver, Ownable {
    /// @dev Reverts if called by any account other than the owner for token sending.
    modifier tokenOnlyOwner() {
        require(tkn.sender == owner);
        _;
    }
}