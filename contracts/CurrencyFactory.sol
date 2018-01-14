pragma solidity 0.4.18;

import './ColuLocalCurrency.sol';
import './EllipseMarketMaker.sol';
import './MarketMaker.sol';
import './ERC20.sol';
import './Ownable.sol';
import './Standard223Receiver.sol';

/// @title Colu Local Currency + Market Maker factory contract.
/// @author Rotem Lev.
contract CurrencyFactory is Standard223Receiver, TokenHolder {

  event MarketOpen(address indexed marketMaker);

  struct CurrencyStruct {
    string name;
    uint8 decimals;
    uint256 totalSupply;
    address contractAddress;
    address mmAddress;
  }

  //map of Market Maker owners
  mapping (address => CurrencyStruct) public currecnyMap;

  address public clnAddress;

  /// @dev constructor only reuires the address of the CLN token which must use the ERC20 interface
  function CurrencyFactory(address _clnAddress) public {
  	require(_clnAddress != address(0));
  	clnAddress = _clnAddress;
  }

  /// @dev create the MarketMaker and the CC token put all the CC token in the Market Maker reserve
  /// @param _name string name for CC token that is created.
  /// @param _symbol string symbol for CC token that is created.
  /// @param _decimals uint8 percison for CC token that is created.
  /// @param _totalSupply uint256 total supply of the CC token that is created.
  function createCurrency(string _name, string _symbol, uint8 _decimals, uint256 _totalSupply) public returns(address marketMaker) {
  	require(currecnyMap[msg.sender].totalSupply == 0);
  	var subToken = new ColuLocalCurrency(_name, _symbol, _decimals, _totalSupply);
  	var newMarketMaker = new EllipseMarketMaker(clnAddress, subToken);
  	//set allowance 
  	require(subToken.transfer(newMarketMaker, _totalSupply));
  	require(newMarketMaker.initializeAfterTransfer());
  	currecnyMap[msg.sender] = CurrencyStruct({ name: _name, decimals: _decimals, totalSupply: _totalSupply , mmAddress: newMarketMaker, contractAddress: subToken});
  	return newMarketMaker;
  }

  /// @dev normal send cln to the market maker contract, sender must approve() before calling method. can only be called by owner
  /// @dev sending CLN will return CC from the reserve to the sender.
  /// @param clnAmount uint256 amount of CLN to transfer into the Market Maker reserve.
  function insertCLNtoMarketMaker(uint256 clnAmount) public returns (bool success) {
  	require(clnAmount > 0);
  	require(ERC20(clnAddress).transferFrom(msg.sender, this, clnAmount));
  	require(ERC20(clnAddress).approve(currecnyMap[msg.sender].mmAddress, clnAmount));
  	var subTokenAmount = MarketMaker(currecnyMap[msg.sender].mmAddress).change(clnAddress, clnAmount, currecnyMap[msg.sender].contractAddress);
    require(ERC20(currecnyMap[msg.sender].contractAddress).transfer(msg.sender, subTokenAmount));
    return true;
  }

  /// @dev ERC223 transferAndCall, send cln to the market maker contract can only be called by owner (see MarketMaker)
  /// @dev sending CLN will return CC from the reserve to the sender.
  function insertCLNtoMarketMaker() public tokenPayable returns (bool success) {
  	require(ERC20(clnAddress).approve(currecnyMap[tkn.sender].mmAddress, tkn.value));
  	var subTokenAmount = MarketMaker(currecnyMap[tkn.sender].mmAddress).change(clnAddress, tkn.value, currecnyMap[tkn.sender].contractAddress);
    require(ERC20(currecnyMap[tkn.sender].contractAddress).transfer(tkn.sender, subTokenAmount));
    return true;
  }
  
  /// @dev normal send cc to the market maker contract, sender must approve() before calling method. can only be called by owner
  /// @dev sending CC will return CLN from the reserve to the sender.
  /// @param ccAmount uint256 amount of CC to transfer into the Market Maker reserve.          
  function extractCLNfromMarketMaker(uint256 ccAmount) public returns (bool success) {
  	require(ERC20(currecnyMap[msg.sender].contractAddress).transferFrom(msg.sender, this, ccAmount));
  	require(ERC20(currecnyMap[msg.sender].contractAddress).approve(currecnyMap[msg.sender].mmAddress, ccAmount));
  	var clnTokenAmount = MarketMaker(currecnyMap[msg.sender].mmAddress).change(currecnyMap[msg.sender].contractAddress, ccAmount, clnAddress );
  	require(ERC20(clnAddress).transfer(msg.sender, clnTokenAmount));
  	return true;
  }

  /// @dev ERC223 transferAndCall, send cc to the market maker contract can only be called by owner (see MarketMaker)
  /// @dev sending CC will return CLN from the reserve to the sender.
  function extractCLNfromMarketMaker() public tokenPayable returns (bool success) {
  	require(ERC20(currecnyMap[tkn.sender].contractAddress).approve(currecnyMap[tkn.sender].mmAddress, tkn.value));
  	var clnTokenAmount = MarketMaker(currecnyMap[tkn.sender].mmAddress).change(currecnyMap[tkn.sender].contractAddress, tkn.value, clnAddress );
  	require(ERC20(clnAddress).transfer(tkn.sender, clnTokenAmount));
  	return true;
  }
  
  /// @dev opens the Market Maker to recvice transactions from all sources.
  /// @dev Request to transfer ownership of Market Maker contract to Owner instead of factory.
  function openMarket() public returns (bool success) {
  	require(MarketMaker(currecnyMap[msg.sender].mmAddress).openForPublicTrade());
  	Ownable(currecnyMap[msg.sender].mmAddress).requestOwnershipTransfer(msg.sender);
  	MarketOpen(currecnyMap[msg.sender].mmAddress);
  	return true;
  }

  /// @dev implementation for standard 223 reciver.
  /// @param token the token used with transferAndCall.
  function supportsToken(address token) public constant returns (bool) {
  	return (clnAddress == token || currecnyMap[msg.sender].contractAddress == token);
  }


}

