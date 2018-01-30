pragma solidity 0.4.18;

import './SafeMath.sol';
import './CurrencyFactory.sol';
import './MarketMaker.sol';
import './ERC20.sol';
import './Ownable.sol';
import './Standard223Receiver.sol';


/**
 * The IssueanceFactory creates an issuence contract that accpets on one side CLN
 * locks then up in an elipse market maker up to the supplied softcap
 * and returns a CC token based on price that is derived form the two supplies and reserves of each
 */

/// @title Colu Issueance factoy with CLN for CC tokens.
/// @author Rotem Lev.
contract IssueanceFactory is CurrencyFactory{
	using SafeMath for uint256;

	uint256 public precision;

  struct IssueanceStruct {
  	uint256 hardcap;
  	uint256 reserve;
    uint256 startTime;
    uint256 endTime;
    uint256 targetPrice;
    bool isOpen;
  }

  //map of Market Maker owners
  mapping (address => IssueanceStruct) public issueMap;
  // total supply of CLN
  uint256 public CLNTotalSupply;


  // sale has begun based on time and status 
  modifier hasStarted(address _token) { 
  	require((now >= issueMap[_token].startTime) && issueMap[_token].isOpen);
  	_; 
  }
  // sale is passed its endtime 
  modifier hasEnded(address _token) { 
    require(issueMap[_token].endTime < now);
  	_; 
  }
  // sale has not yet reached hardcap
  modifier underHardcap(address _token, uint256 amount) { 
  	require(ERC20(clnAddress).balanceOf(currencyMap[_token].mmAddress)  < issueMap[_token].hardcap);
  	_; 
  }
  
  // sale considerd succlessful when it raised equal to or more than the softcap
  modifier saleWasSuccessfull(address _token) { 
  	require(ERC20(clnAddress).balanceOf(currencyMap[_token].mmAddress) >= issueMap[_token].reserve);
  	_; 
  }
   // sale considerd failed when it raised less than the softcap
  modifier saleHasFailed(address _token) { 
  	require(ERC20(clnAddress).balanceOf(currencyMap[_token].mmAddress) < issueMap[_token].reserve);
  	_; 
  }
  // checks if the instance of market maker contract is open for public 
  modifier marketClosed(address _token) { 
  	require(!MarketMaker(currencyMap[_token].mmAddress).isOpenForPublic()); 
  	_; 
  }
  
  
  
  /// @dev constructor
  /// @param _mmLib address for the deployed elipse market maker contract
  /// @param _clnAddress address for the deployed CLN ERC20 token
  function IssueanceFactory(address _mmLib, address _clnAddress) public CurrencyFactory(_mmLib, _clnAddress) {
    CLNTotalSupply = ERC20(_clnAddress).totalSupply();
    precision = _mmLib.PRECISION;
  }
  
  function createIssueance( uint256 _startTime, 
                            uint256 _durationTime, 
                            uint256 _hardcap, 
                            uint256 _reserveAmount,
                            string _name, 
                            string _symbol, 
                            uint8 _decimals, 
                            uint256 _totalSupply) public 
                            returns (address) {
    require(_startTime > now);
    require(_durationTime > 0);
    var R2 = IEllipseMarketMaker(mmLibAddress).calcReserve(_reserveAmount, CLNTotalSupply, _totalSupply);
    var targetPrice =  IEllipseMarketMaker(mmLibAddress).getPrice(_reserveAmount, R2, CLNTotalSupply, _totalSupply);
    require(isValidIssueance(_hardcap, targetPrice, _totalSupply, R2));
    var tokenAddress = super.createCurrency( _name,  _symbol,  _decimals,  _totalSupply);
    addToMap(tokenAddress, _startTime, _startTime + _durationTime, _hardcap, _reserveAmount, targetPrice);

    return tokenAddress;
  }

  /// @dev internal helper to add all the data to the map
  /// @param _token address token address for this issueance (same as CC adress)
  /// @param _startTime uint256 blocktime for sale start
  /// @param _endTime uint256 blocktime for sale end
  /// @param _hardcap uint256 sale hardcap
  /// @param _reserveAmount uint256 sale softcap
  /// @param _targetPrice uint256 sale CC price per CLN if it were to pass the softcap
  function addToMap(address _token, 
                    uint256 _startTime, 
                    uint256 _endTime, 
                    uint256 _hardcap, 
                    uint256 _reserveAmount, 
                    uint256 _targetPrice) private {
  	issueMap[_token] = IssueanceStruct({ hardcap: _hardcap, 
    																				 reserve: _reserveAmount,
    																				 isOpen: true , 
    																				 startTime: _startTime, 
    																				 endTime: _endTime,
    																				 targetPrice: _targetPrice});
  }

  /// @dev particiapte in the CLN based issueance
  /// @param _token address token address for this issueance (same as CC adress)
  /// @param _clnAmount uint256 amount of CLN to try and participate
  function participate(address _token, 
  											uint256 _clnAmount) public 
  											hasStarted(_token) 
  											underHardcap(_token, _clnAmount) 
  											returns (bool) {
  	require(_clnAmount > 0);
    
    address marketMakerAddress = getMarketMakerAddressFromToken(_token);
    // how much do we need to actually send to mm of the incomming amount
    // and how much of the amount can participate
    var (transferToReserveAmount, participationAmount) = getParticipationAmounts(marketMakerAddress, _clnAmount, _token);
    // send what we need to the market maker for reserve
    require(ERC20(clnAddress).transferFrom(msg.sender, this, participationAmount));
  	approveAndChange(clnAddress, _token, transferToReserveAmount, marketMakerAddress);
    // pay back to participant with the participated amount * price
    var releaseAmount = participationAmount.mul(issueMap[_token].targetPrice).div(precision);
    require(ERC20(_token).transfer(msg.sender, releaseAmount));
    return true;
  }



  /// @dev particiapte in the CLN based issueance
  /// @param _token address token address for this issueance (same as CC adress)
  function participate(address _token) 
  											public 
  											tokenPayable
  											hasStarted(_token) 
  											underHardcap(_token, tkn.value) 
  											returns (bool) {
  	require(tkn.value > 0 && msg.sender == clnAddress);
    //check if we need to send cln to mm or save it
    var (transferToReserveAmount, participationAmount) = getParticipationAmounts(marketMakerAddress, tkn.value, _token);
    address marketMakerAddress = getMarketMakerAddressFromToken(_token);

  	approveAndChange(clnAddress, _token, transferToReserveAmount, marketMakerAddress);
    // transfer only what we need
    var releaseAmount = participationAmount.mul(issueMap[_token].targetPrice).div(precision);
    require(ERC20(_token).transfer(tkn.sender, releaseAmount));
    // send CLN change to the participent since its transferAndCall
    if(tkn.value > participationAmount)
       require(ERC20(clnAddress).transfer(tkn.sender, tkn.value.sub(participationAmount)));
    return true;
  }

  /// @dev called by the creator to finish the sale, open the market maker and get his tokens
  /// @dev can only be called after the sale end time and if the sale passed the softcap
  /// @param _token address token address for this issueance (same as CC adress)
  function finalize(address _token) public
  							tokenIssuerOnly(_token, msg.sender) 
  							hasEnded(_token) 
  							saleWasSuccessfull(_token) 
  							marketClosed(_token) 
  							returns (bool) {
    // move all CC and CLN that were raised and not in the reserves to the issuer
    address marketMakerAddress = getMarketMakerAddressFromToken(_token);
    uint256 clnAmount = ERC20(clnAddress).balanceOf(this);
    uint256 ccAmount = ERC20(_token).balanceOf(this);
    require(ERC20(_token).transfer(msg.sender, ccAmount));
    require(ERC20(clnAddress).transfer(msg.sender, clnAmount));
    // open Market Maker for public trade.
    require(MarketMaker(marketMakerAddress).openForPublicTrade());
    return true;
	}

  /// @dev give back cc and get a rfund back in CLN, can only be called after sale ended and if softcap not reached
  /// @param _token address token address for this issueance (same as CC adress)
  /// @param _ccAmount uint256 amount of CC to try and refund
  function refund(address _token,
                  uint256 _ccAmount) public 
  							hasEnded(_token) 
  							saleHasFailed(_token) 
  							marketClosed(_token) 
  							returns (bool) {
  	//if we have CC time to thorw it to the Market Maker
  	address marketMakerAddress = getMarketMakerAddressFromToken(_token);											
  	require(ERC20(_token).transferFrom(msg.sender, this, _ccAmount));
  	uint256 factoryCCAmount = ERC20(_token).balanceOf(this);
  	require(ERC20(_token).approve(marketMakerAddress, factoryCCAmount));
  	require(MarketMaker(marketMakerAddress).change(_token, factoryCCAmount, clnAddress) > 0);
    
  	var returnAmount = _ccAmount.mul(precision).div(issueMap[_token].targetPrice);
  	require(ERC20(clnAddress).transfer(msg.sender, returnAmount));
    return true;

  }


  /// @dev give back cc and get a rfund back in CLN, can only be called after sale ended and if softcap not reached
  function refund() public
                tokenPayable 
  							hasEnded(msg.sender) 
  							saleHasFailed(msg.sender) 
  							marketClosed(msg.sender) 
  							returns (bool) {
  	//if we have CC time to thorw it to the Market Maker
  	address marketMakerAddress = getMarketMakerAddressFromToken(msg.sender);								
  	uint256 factoryCCAmount = ERC20(msg.sender).balanceOf(this);
  	require(ERC20(msg.sender).approve(marketMakerAddress, factoryCCAmount));
  	require(MarketMaker(marketMakerAddress).change(msg.sender, factoryCCAmount, clnAddress) > 0);
    
  	var returnAmount = tkn.value.mul(precision).div(issueMap[msg.sender].targetPrice);
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
  function insertCLNtoMarketMaker(address) public tokenPayable returns (uint256) {
    require(false);
    return 0;
  }
  
  /// @dev normal send cc to the market maker contract, sender must approve() before calling method. can only be called by owner
  /// @dev sending CC will return CLN from the reserve to the sender.         
  function extractCLNfromMarketMaker(address, uint256) public returns (uint256) {
    require(false);
    return 0;
  }

  /// @dev ERC223 transferAndCall, send cc to the market maker contract can only be called by owner (see MarketMaker)
  /// @dev sending CC will return CLN from the reserve to the sender.
  function extractCLNfromMarketMaker() public tokenPayable returns (uint256) {
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
  /// @param _hardcap uint256 CLN hardcap for issueance
  /// @param _price uint256 computed through the market maker using the supplies and reserves
  /// @param _S2 uint256 supply of the CC token 
  /// @param _R2 uint256 reserve of the CC token
  function isValidIssueance(uint256 _hardcap, 
                            uint256 _price, 
                            uint256 _S2, 
                            uint256 _R2) private pure 
                            returns (bool) {
 	  return (_S2 > _R2 && _S2.sub(_R2).mul(precision) >= _hardcap.mul(_price));
  }


  /// @dev helper function to fetch market maker contract address deploed with the CC
  /// @param _token address token address for this issueance (same as CC adress)
  function getMarketMakerAddressFromToken(address _token) public constant returns (address) {
  	return currencyMap[_token].mmAddress;
  }

  /// @dev helper function to approve tokens for market maker and then chane tokens
  /// @param _token address deployed ERC20 token address to spend
  /// @param _token2 address deployed ERC20 token address to buy
  /// @param _amount uint256 amount of _token to spend
  /// @param _marketMakerAddress address for the deploed market maker with this CC
  function approveAndChange(address _token, 
                            address _token2, 
                            uint256 _amount, 
                            address _marketMakerAddress) private 
                            returns (uint256) {
  	if(_amount > 0) {
	  	require(ERC20(_token).approve(_marketMakerAddress, _amount));
	  	return MarketMaker(_marketMakerAddress).change(_token, _amount, _token2);
	  }
	  return 0;
  }

  /// @dev helper function participation with CLN
  /// @dev returns the amount to send to reserve and amount to participate
  /// @param _marketMakerAddress address deployed market maker for this CC
  /// @param _clnAmount amount of cln the user wants to participate with
  /// @param _token address token address for this issueance (same as CC adress)
  function getParticipationAmounts(address _marketMakerAddress, 
                                   uint256 _clnAmount, 
                                   address _token) private view 
                                   returns (uint256, uint256){
    uint256 mmBalance = ERC20(clnAddress).balanceOf(_marketMakerAddress);
    uint256 reserve = issueMap[_token].reserve;
    uint256 hardcap = issueMap[_token].hardcap;
    uint256 participationAmount = SafeMath.min256(_clnAmount, hardcap.sub(mmBalance));
    if(mmBalance + participationAmount > reserve) {
      if(mmBalance < reserve) {
        // some cln to reserve, some or all cln participate
        return (reserve.sub(mmBalance), participationAmount);
      }
      // no cln to reserve some or all cln participate
      return (0, participationAmount);
    }
    // all cln to reserve all cln participate
    return (participationAmount, participationAmount);
  }

}

