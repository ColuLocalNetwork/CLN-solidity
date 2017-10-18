pragma solidity ^0.4.15;

import '../TestTokenSale.sol';

contract TestTokenSaleMock is TestTokenSale {
    function TestTokenSaleMock(address _fundingRecipient,
        address _communityPoolAddress,
        address _futureDevelopmentPoolAddress,
        address _stakeholdersPoolAddress,
        address _unallocatedTokensPoolAddress,
        uint256 _startTime)
        TestTokenSale(_fundingRecipient,
        _communityPoolAddress,
        _futureDevelopmentPoolAddress,
        _stakeholdersPoolAddress,
        _unallocatedTokensPoolAddress,
        _startTime) {
    }

    function setTokensSold(uint256 _tokensSold) {
        tokensSold = _tokensSold;
    }
}