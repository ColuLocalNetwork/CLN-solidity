pragma solidity 0.4.18;

import '../ColuLocalNetworkSale.sol';

contract ColuLocalNetworkSaleMock is ColuLocalNetworkSale {
    function ColuLocalNetworkSaleMock(address _owner,
        address _fundingRecipient,
        address _communityPoolAddress,
        address _futureDevelopmentPoolAddress,
        address _stakeholdersPoolAddress,
        uint256 _startTime)
        ColuLocalNetworkSale(_owner,
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