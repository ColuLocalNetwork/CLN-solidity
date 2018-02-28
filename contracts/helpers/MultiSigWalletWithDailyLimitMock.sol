pragma solidity ^0.4.18;

import '../MultiSigWalletWithDailyLimit.sol';

contract MultiSigWalletWithDailyLimitMock is MultiSigWalletWithDailyLimit {
    uint256 public transactionId;

    function MultiSigWalletWithDailyLimitMock(address[] _owners, uint8 _required, uint256 _dailyLimit) public MultiSigWalletWithDailyLimit(_owners, _required, _dailyLimit) {
    }

    function submitTransaction(address _destination, uint256 _value, bytes _data) public returns (uint256 _transactionId) {
        transactionId = super.submitTransaction(_destination, _value, _data);

        return transactionId;
    }
}