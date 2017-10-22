pragma solidity ^0.4.15;

import '../TestTokenSale.sol';

contract TestTokenSaleMock is TestTokenSale {
    function TestTokenSaleMock(address _owner,
        address _fundingRecipient,
        address _communityPoolAddress,
        address _futureDevelopmentPoolAddress,
        address _stakeholdersPoolAddress,
        uint256 _startTime)
        TestTokenSale(_owner,
        _fundingRecipient,
        _communityPoolAddress,
        _futureDevelopmentPoolAddress,
        _stakeholdersPoolAddress,
        _startTime) {
    }

    function setTokensSold(uint256 _tokensSold) {
        tokensSold = _tokensSold;
    }
}