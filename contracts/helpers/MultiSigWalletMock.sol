pragma solidity 0.4.18;

import '../MultiSigWallet.sol';

contract MultiSigWalletMock is MultiSigWallet {
    uint256 public transactionId;

    function MultiSigWalletMock(address[] _owners, uint8 _required) public MultiSigWallet(_owners, _required) {
    }

    function submitTransaction(address _destination, uint256 _value, bytes _data) public returns (uint256 _transactionId) {
        transactionId = super.submitTransaction(_destination, _value, _data);

        return transactionId;
    }
}