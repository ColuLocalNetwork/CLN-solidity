pragma solidity ^0.4.18;

import './SafeMath.sol';
import './CurrencyFactory.sol';
import './MarketMaker.sol';
import './ERC20.sol';
import './Ownable.sol';
import './Standard223Receiver.sol';

/**
 * The IssuanceFactory creates an issuance contract that accepts on one side CLN
 * locks then up in an elipse market maker up to the supplied softcap
 * and returns a CC token based on price that is derived form the two supplies and reserves of each
 */

/// @title Colu Issuance factoy with CLN for CC tokens.
/// @author Rotem Lev.
contract IssuanceFactory is CurrencyFactory {
	using SafeMath for uint256;

	uint256 public PRECISION;

  struct IssuanceStruct {
  	uint256 hardcap;
  	uint256 reserve;
    uint256 startTime;
    uint256 endTime;
    uint256 targetPrice;
    uint256 clnRaised;
  }

  uint256 public totalCLNcustodian;

  //map of Market Maker owners
  mapping (address => IssuanceStruct) public issueMap;
  // total supply of CLN
  uint256 public CLNTotalSupply;

  event CLNRaised(address indexed token, address indexed participant, uint256 amount);
  event CLNRefunded(address indexed token, address indexed participant, uint256 amount);

  event SaleFinalized(address indexed token, uint256 clnRaised);

  // sale has begun based on time and status
  modifier saleOpen(address _token) {
  	require(now >= issueMap[_token].startTime && issueMap[_token].endTime >= now);
    require(issueMap[_token].clnRaised < issueMap[_token].hardcap);
  	_;
  }

  // sale is passed its endtime
  modifier hasEnded(address _token) {
    require(issueMap[_token].endTime < now);
  	_;
  }

  // sale considered successful when it raised equal to or more than the softcap
  modifier saleWasSuccessfull(address _token) {
  	require(issueMap[_token].clnRaised >= issueMap[_token].reserve);
  	_;
  }

   // sale considerd failed when it raised less than the softcap
  modifier saleHasFailed(address _token) {
  	require(issueMap[_token].clnRaised < issueMap[_token].reserve);
  	_;
  }

  /// @dev constructor
  /// @param _mmLib address for the deployed elipse market maker contract
  /// @param _clnAddress address for the deployed CLN ERC20 token
  function IssuanceFactory(address _mmLib, address _clnAddress) public CurrencyFactory(_mmLib, _clnAddress) {
    CLNTotalSupply = ERC20(_clnAddress).totalSupply();
    PRECISION = IEllipseMarketMaker(_mmLib).PRECISION();
  }

	/// @dev createIssuance create local currency issuance sale
	/// @param _startTime uint256 blocktime for sale start
	/// @param _durationTime uint 256 duration of the sale
	/// @param _hardcap uint CLN hardcap for issuance
	/// @param _reserveAmount uint CLN reserve amount
	/// @param _name string name of the token
	/// @param _symbol string symbol of the token
	/// @param _decimals uint8 ERC20 decimals of local currency
	/// @param _totalSupply uint total supply of the local currency
	/// @param _tokenURI string the URI may point to a JSON file that conforms to the "Metadata JSON Schema".
  function createIssuance( uint256 _startTime,
                            uint256 _durationTime,
                            uint256 _hardcap,
                            uint256 _reserveAmount,
                            string _name,
                            string _symbol,
                            uint8 _decimals,
                            uint256 _totalSupply,
														string _tokenURI) public
                            returns (address) {
    require(_startTime > now);
    require(_durationTime > 0);
		require(_hardcap > 0);

    uint256 R2 = IEllipseMarketMaker(mmLibAddress).calcReserve(_reserveAmount, CLNTotalSupply, _totalSupply);
    uint256 targetPrice = IEllipseMarketMaker(mmLibAddress).getPrice(_reserveAmount, R2, CLNTotalSupply, _totalSupply);
    require(isValidIssuance(_hardcap, targetPrice, _totalSupply, R2));
    address tokenAddress = super.createCurrency(_name, _symbol, _decimals, _totalSupply, _tokenURI);
    addToMap(tokenAddress, _startTime, _durationTime, _hardcap, _reserveAmount, targetPrice);

    return tokenAddress;
  }

	/// @dev createIssuance create local currency issuance sale
	/// @param _startTime uint256 blocktime for sale start
	/// @param _durationTime uint 256 duration of the sale
	/// @param _hardcap uint CLN hardcap for issuance
	/// @param _reserveAmount uint CLN reserve amount
	/// @param _name string name of the token
	/// @param _symbol string symbol of the token
	/// @param _decimals uint8 ERC20 decimals of local currency
	/// @param _totalSupply uint total supply of the local currency
	function createIssuance( uint256 _startTime,
														uint256 _durationTime,
														uint256 _hardcap,
														uint256 _reserveAmount,
														string _name,
														string _symbol,
														uint8 _decimals,
														uint256 _totalSupply) public
														returns (address) {
		return createIssuance(_startTime, _durationTime, _hardcap, _reserveAmount, _name, _symbol, _decimals, _totalSupply, '');
	}

  /// @dev internal helper to add currency data to the issuance map
  /// @param _token address token address for this issuance (same as CC adress)
  /// @param _startTime uint256 blocktime for sale start
  /// @param _durationTime uint256 seconds for sale's durationTime
  /// @param _hardcap uint256 sale hardcap
  /// @param _reserveAmount uint256 sale softcap
  /// @param _targetPrice uint256 sale CC price per CLN if it were to pass the softcap
  function addToMap(address _token,
                    uint256 _startTime,
                    uint256 _durationTime,
                    uint256 _hardcap,
                    uint256 _reserveAmount,
                    uint256 _targetPrice) private {
  	issueMap[_token] = IssuanceStruct({ hardcap: _hardcap,
										reserve: _reserveAmount,
										startTime: _startTime,
										endTime: _startTime + _durationTime,
										clnRaised: 0,
										targetPrice: _targetPrice});
  }

  /// @dev participate in the issuance of the local currency
  /// @param _token address token address for this issuance (same as CC adress)
  /// @param _clnAmount uint256 amount of CLN to try and participate
  /// @return releaseAmount uint amount of CC tokens released and transfered to sender
  function participate(address _token,
						uint256 _clnAmount) public
						saleOpen(_token)
						returns (uint256 releaseAmount) {
	require(_clnAmount > 0);
    address marketMakerAddress = getMarketMakerAddressFromToken(_token);

    // how much do we need to actually send to market maker of the incomming amount
    // and how much of the amount can participate
    uint256 transferToReserveAmount;
    uint256 participationAmount;
    (transferToReserveAmount, participationAmount) = getParticipationAmounts(_clnAmount, _token);
    // send what we need to the market maker for reserve
    require(ERC20(clnAddress).transferFrom(msg.sender, this, participationAmount));
  	approveAndChange(clnAddress, _token, transferToReserveAmount, marketMakerAddress);
    // pay back to participant with the participated amount * price
    releaseAmount = participationAmount.mul(issueMap[_token].targetPrice).div(PRECISION);

    issueMap[_token].clnRaised = issueMap[_token].clnRaised.add(participationAmount);
    totalCLNcustodian = totalCLNcustodian.add(participationAmount);
    CLNRaised(_token, msg.sender, participationAmount);
    require(ERC20(_token).transfer(msg.sender, releaseAmount));
  }

  /// @dev Participate in the CLN based issuance (for contract)
  /// @param _token address token address for this issuance (same as CC adress)
  function participate(address _token)
						public
						tokenPayable
						saleOpen(_token)
						returns (uint256 releaseAmount) {
  	require(tkn.value > 0 && msg.sender == clnAddress);
    //check if we need to send cln to mm or save it
    uint256 transferToReserveAmount;
    uint256 participationAmount;
    (transferToReserveAmount, participationAmount) = getParticipationAmounts(tkn.value, _token);
    address marketMakerAddress = getMarketMakerAddressFromToken(_token);
  	approveAndChange(clnAddress, _token, transferToReserveAmount, marketMakerAddress);
    // transfer only what we need
    releaseAmount = participationAmount.mul(issueMap[_token].targetPrice).div(PRECISION);
    issueMap[_token].clnRaised = issueMap[_token].clnRaised.add(participationAmount);
    totalCLNcustodian = totalCLNcustodian.add(participationAmount);
    CLNRaised(_token, tkn.sender, participationAmount);
    require(ERC20(_token).transfer(tkn.sender, releaseAmount));
    // send CLN change to the participent since its transferAndCall
    if (tkn.value > participationAmount)
       require(ERC20(clnAddress).transfer(tkn.sender, tkn.value.sub(participationAmount)));
  }

  /// @dev called by the creator to finish the sale, open the market maker and get his tokens
  /// @dev can only be called after the sale end time and if the sale passed the softcap
  /// @param _token address token address for this issuance (same as CC adress)
  function finalize(address _token) public
  							tokenIssuerOnly(_token, msg.sender)
  							hasEnded(_token)
							saleWasSuccessfull(_token)
  							marketClosed(_token)
  							returns (bool) {
    // move all CC and CLN that were raised and not in the reserves to the issuer
    address marketMakerAddress = getMarketMakerAddressFromToken(_token);
    uint256 clnAmount = issueMap[_token].clnRaised.sub(issueMap[_token].reserve);
    totalCLNcustodian = totalCLNcustodian.sub(clnAmount);
    uint256 ccAmount = ERC20(_token).balanceOf(this);
    // open Market Maker for public trade.
    require(MarketMaker(marketMakerAddress).openForPublicTrade());

    require(ERC20(_token).transfer(msg.sender, ccAmount));
    require(ERC20(clnAddress).transfer(msg.sender, clnAmount));

		Ownable(marketMakerAddress).requestOwnershipTransfer(msg.sender);
		Ownable(_token).requestOwnershipTransfer(msg.sender);

    SaleFinalized(_token, issueMap[_token].clnRaised);
    return true;
	}

  /// @dev Give back CC and get a refund back in CLN,
  /// dev can only be called after sale ended and the softcap not reached
  /// @param _token address token address for this issuance (same as CC adress)
  /// @param _ccAmount uint256 amount of CC to try and refund
  function refund(address _token,
                  uint256 _ccAmount) public
  							hasEnded(_token)
  							saleHasFailed(_token)
  							marketClosed(_token)
  							returns (bool) {
	require(_ccAmount > 0);
	// exchange CC for CLN throuh Market Maker
  	address marketMakerAddress = getMarketMakerAddressFromToken(_token);
  	require(ERC20(_token).transferFrom(msg.sender, this, _ccAmount));
  	uint256 factoryCCAmount = ERC20(_token).balanceOf(this);
  	require(ERC20(_token).approve(marketMakerAddress, factoryCCAmount));
  	require(MarketMaker(marketMakerAddress).change(_token, factoryCCAmount, clnAddress) > 0);

  	uint256 returnAmount = _ccAmount.mul(PRECISION).div(issueMap[_token].targetPrice);
    issueMap[_token].clnRaised = issueMap[_token].clnRaised.sub(returnAmount);
    totalCLNcustodian = totalCLNcustodian.sub(returnAmount);
    CLNRefunded(_token, msg.sender, returnAmount);
  	require(ERC20(clnAddress).transfer(msg.sender, returnAmount));
    return true;
  }


  /// @dev Give back CC and get a refund back in CLN,
  /// dev can only be called after sale ended and the softcap not
  function refund() public
	                tokenPayable
					hasEnded(msg.sender)
					saleHasFailed(msg.sender)
					marketClosed(msg.sender)
					returns (bool) {
	require(tkn.value > 0);
  	// if we have CC time to thorw it to the Market Maker
  	address marketMakerAddress = getMarketMakerAddressFromToken(msg.sender);
  	uint256 factoryCCAmount = ERC20(msg.sender).balanceOf(this);
  	require(ERC20(msg.sender).approve(marketMakerAddress, factoryCCAmount));
  	require(MarketMaker(marketMakerAddress).change(msg.sender, factoryCCAmount, clnAddress) > 0);

  	uint256 returnAmount = tkn.value.mul(PRECISION).div(issueMap[msg.sender].targetPrice);
    issueMap[msg.sender].clnRaised = issueMap[msg.sender].clnRaised.sub(returnAmount);
    totalCLNcustodian = totalCLNcustodian.sub(returnAmount);
    CLNRefunded(msg.sender, tkn.sender, returnAmount);
  	require(ERC20(clnAddress).transfer(tkn.sender, returnAmount));
    return true;

  }

  /// @dev normal send cln to the market maker contract, sender must approve() before calling method. can only be called by owner
  /// @dev sending CLN will return CC from the reserve to the sender.
  function insertCLNtoMarketMaker(address, uint256) public returns (uint256) {
    require(false);
    return 0;
  }

  /// @dev ERC223 transferAndCall, send cln to the market maker contract can only be called by owner (see MarketMaker)
  /// @dev sending CLN will return CC from the reserve to the sender.
  function insertCLNtoMarketMaker(address) public returns (uint256) {
    require(false);
    return 0;
  }

  /// @dev normal send CC to the market maker contract, sender must approve() before calling method. can only be called by owner
  /// @dev sending CC will return CLN from the reserve to the sender.
  function extractCLNfromMarketMaker(address, uint256) public returns (uint256) {
    require(false);
    return 0;
  }

  /// @dev ERC223 transferAndCall, send CC to the market maker contract can only be called by owner (see MarketMaker)
  /// @dev sending CC will return CLN from the reserve to the sender.
  function extractCLNfromMarketMaker() public returns (uint256) {
    require(false);
    return 0;
  }

  /// @dev opens the Market Maker to recvice transactions from all sources.
  /// @dev Request to transfer ownership of Market Maker contract to Owner instead of factory.
  function openMarket(address) public returns (bool) {
		require(false);
		return false;
  }

  /// @dev checks if the parameters that were sent to the create are valid for a promised price and buyback
  /// @param _hardcap uint256 CLN hardcap for issuance
  /// @param _price uint256 computed through the market maker using the supplies and reserves
  /// @param _S2 uint256 supply of the CC token
  /// @param _R2 uint256 reserve of the CC token
  function isValidIssuance(uint256 _hardcap,
                            uint256 _price,
                            uint256 _S2,
                            uint256 _R2) public view
                            returns (bool) {
 	  return (_S2 > _R2 && _S2.sub(_R2).mul(PRECISION) >= _hardcap.mul(_price));
  }


  /// @dev helper function to fetch market maker contract address deploed with the CC
  /// @param _token address token address for this issuance (same as CC adress)
  function getMarketMakerAddressFromToken(address _token) public constant returns (address) {
  	return currencyMap[_token].mmAddress;
  }

  /// @dev helper function to approve tokens for market maker and then change tokens
  /// @param _token address deployed ERC20 token address to spend
  /// @param _token2 address deployed ERC20 token address to buy
  /// @param _amount uint256 amount of _token to spend
  /// @param _marketMakerAddress address for the deploed market maker with this CC
  function approveAndChange(address _token,
                            address _token2,
                            uint256 _amount,
                            address _marketMakerAddress) private
                            returns (uint256) {
  	if (_amount > 0) {
	  	require(ERC20(_token).approve(_marketMakerAddress, _amount));
	  	return MarketMaker(_marketMakerAddress).change(_token, _amount, _token2);
	  }
	  return 0;
  }

  /// @dev helper function participation with CLN
  /// @dev returns the amount to send to reserve and amount to participate
  /// @param _clnAmount amount of cln the user wants to participate with
  /// @param _token address token address for this issuance (same as CC adress)
  /// @return {
  ///	"transferToReserveAmount": amount of CLN to transfer to reserves
  ///	"participationAmount": amount of CLN that the sender will participate with in the sale
  ///}
  function getParticipationAmounts(uint256 _clnAmount,
                                   address _token) private view
                                   returns (uint256 transferToReserveAmount, uint256 participationAmount) {
    uint256 clnRaised = issueMap[_token].clnRaised;
    uint256 reserve = issueMap[_token].reserve;
    uint256 hardcap = issueMap[_token].hardcap;
    participationAmount = SafeMath.min256(_clnAmount, hardcap.sub(clnRaised));
    if (reserve > clnRaised) {
      transferToReserveAmount = SafeMath.min256(participationAmount, reserve.sub(clnRaised));
    }
  }

  /// @dev Returns total number of issuances after filters are applied.
  /// @dev this function is gas wasteful so do not call this from a state changing transaction
  /// @param _pending include pending currency issuances.
  /// @param _started include started currency issuances.
  /// @param _successful include successful and ended currency issuances.
  /// @param _failed include failed and ended currency issuances.
  /// @return Total number of currency issuances after filters are applied.
  function getIssuanceCount(bool _pending, bool _started, bool _successful, bool _failed)
    public
    view
    returns (uint _count)
  {
    for (uint i = 0; i < tokens.length; i++) {
      IssuanceStruct memory issuance = issueMap[tokens[i]];
      if ((_pending && issuance.startTime > now)
        || (_started && now >= issuance.startTime && issuance.endTime >= now && issuance.clnRaised < issuance.hardcap)
        || (_successful && issuance.endTime < now && issuance.clnRaised >= issuance.reserve)
        || (_successful && issuance.endTime >= now && issuance.clnRaised == issuance.hardcap)
        || (_failed && issuance.endTime < now && issuance.clnRaised < issuance.reserve))
        _count += 1;
    }
  }

  /// @dev Returns list of issuance ids (allso the token address of the issuance) in defined range after filters are applied.
  /// @dev _offset and _limit parameters are intended for pagination
  /// @dev this function is gas wasteful so do not call this from a state changing transaction
  /// @param _pending include pending currency issuances.
  /// @param _started include started currency issuances.
  /// @param _successful include successful and ended currency issuances.
  /// @param _failed include failed and ended currency issuances.
  /// @param _offset index start position of issuance ids array.
  /// @param _limit maximum number of issuance ids to return.
  /// @return Returns array of token adresses for issuance.
  function getIssuanceIds(bool _pending, bool _started, bool _successful, bool _failed, uint _offset, uint _limit)
    public
    view
    returns (address[] _issuanceIds)
  {
	require(_limit >= 1);
	require(_limit <= 100);
    _issuanceIds = new address[](_limit);
    uint filteredIssuancesCount = 0;
	uint retrieveIssuancesCount = 0;
    for (uint i = 0; i < tokens.length; i++) {
      IssuanceStruct memory issuance = issueMap[tokens[i]];
      if ((_pending && issuance.startTime > now)
        || (_started && now >= issuance.startTime && issuance.endTime >= now && issuance.clnRaised < issuance.hardcap)
        || (_successful && issuance.endTime < now && issuance.clnRaised >= issuance.reserve)
        || (_successful && issuance.endTime >= now && issuance.clnRaised == issuance.hardcap)
        || (_failed && issuance.endTime < now && issuance.clnRaised < issuance.reserve))
      {
		if (filteredIssuancesCount >= _offset) {
			_issuanceIds[retrieveIssuancesCount] = tokens[i];
			retrieveIssuancesCount += 1;
		}
		if (retrieveIssuancesCount == _limit) {
			return _issuanceIds;
		}
        filteredIssuancesCount += 1;
      }
    }

	if (retrieveIssuancesCount < _limit) {
		address[] memory _issuanceIdsTemp = new address[](retrieveIssuancesCount);
		for (i = 0; i < retrieveIssuancesCount; i++) {
			_issuanceIdsTemp[i] = _issuanceIds[i];
		}
		return _issuanceIdsTemp;
	}
  }

  /// @dev Allow the owner to transfer out any accidentally sent ERC20 tokens.
  /// @param _tokenAddress address The address of the ERC20 contract.
  /// @param _amount uint256 The amount of tokens to be transferred.
  function transferAnyERC20Token(address _tokenAddress, uint256 _amount) public onlyOwner returns (bool success) {
    if (_tokenAddress == clnAddress) {
      uint256 excessCLN = ERC20(clnAddress).balanceOf(this).sub(totalCLNcustodian);
      require(excessCLN <= _amount);
    }

    if (issueMap[_tokenAddress].hardcap > 0) {
      require(MarketMaker(currencyMap[_tokenAddress].mmAddress).isOpenForPublic());
    }
    return ERC20(_tokenAddress).transfer(owner, _amount);
  }
}
