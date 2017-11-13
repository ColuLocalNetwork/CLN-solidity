pragma solidity 0.4.18;

import '../MultiSigWalletWithDailyLimit.sol';

contract MultiSigWalletWithDailyLimitMock is MultiSigWalletWithDailyLimit {
    uint256 public transactionId;

    function MultiSigWalletWithDailyLimitMock(address[] _owners, uint _required, uint _dailyLimit) public MultiSigWalletWithDailyLimit(_owners, _required, _dailyLimit) {
    }

    function submitTransaction(address _destination, uint _value, bytes _data) public returns (uint _transactionId) {
        transactionId = super.submitTransaction(_destination, _value, _data);

        return transactionId;
    }
}