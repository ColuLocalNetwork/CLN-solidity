pragma solidity ^0.4.18;

import './ColuLocalCurrency.sol';
import './EllipseMarketMaker.sol';
import './IEllipseMarketMaker.sol';
import './ERC20.sol';
import './Ownable.sol';
import './Standard223Receiver.sol';

/// @title Colu Local Currency + Market Maker factory contract.
/// @author Rotem Lev.
contract CurrencyFactory is Standard223Receiver, TokenHolder {

  struct CurrencyStruct {
    string name;
    uint8 decimals;
    uint256 totalSupply;
    address owner;
    address mmAddress;
  }


  // map of Market Maker owners: token address => currency struct
  mapping (address => CurrencyStruct) public currencyMap;
  // address of the deployed CLN contract (ERC20 Token)
  address public clnAddress;
  // address of the deployed elipse market maker contract
  address public mmLibAddress;

  address[] public tokens;

  event MarketOpen(address indexed marketMaker);
  event TokenCreated(address indexed token, address indexed owner);

  // modifier to check if called by issuer of the token
  modifier tokenIssuerOnly(address token, address owner) {
    require(currencyMap[token].owner == owner);
    _;
  }
  // modifier to only accept transferAndCall from CLN token
  modifier CLNOnly() {
    require(msg.sender == clnAddress);
    _;
  }

  /// @dev checks if the instance of market maker contract is closed for public
  /// @param _token address address of the CC token.
  modifier marketClosed(address _token) {
  	require(!MarketMaker(currencyMap[_token].mmAddress).isOpenForPublic());
  	_;
  }

  /// @dev checks if the instance of market maker contract is open for public
  /// @param _token address address of the CC token.
  modifier marketOpen(address _token) {
    require(MarketMaker(currencyMap[_token].mmAddress).isOpenForPublic());
    _;
  }

  /// @dev constructor only reuires the address of the CLN token which must use the ERC20 interface
  /// @param _mmLib address for the deployed market maker elipse contract
  /// @param _clnAddress address for the deployed ERC20 CLN token
  function CurrencyFactory(address _mmLib, address _clnAddress) public {
  	require(_mmLib != address(0));
  	require(_clnAddress != address(0));
  	mmLibAddress = _mmLib;
  	clnAddress = _clnAddress;
  }

  /// @dev create the MarketMaker and the CC token put all the CC token in the Market Maker reserve
  /// @param _name string name for CC token that is created.
  /// @param _symbol string symbol for CC token that is created.
  /// @param _decimals uint8 percison for CC token that is created.
  /// @param _totalSupply uint256 total supply of the CC token that is created.
  /// @param _tokenURI string the URI may point to a JSON file that conforms to the "Metadata JSON Schema".
  function createCurrency(string _name,
                          string _symbol,
                          uint8 _decimals,
                          uint256 _totalSupply,
                          string _tokenURI) public
                          returns (address) {

  	ColuLocalCurrency subToken = new ColuLocalCurrency(_name, _symbol, _decimals, _totalSupply, _tokenURI);
  	EllipseMarketMaker newMarketMaker = new EllipseMarketMaker(mmLibAddress, clnAddress, subToken);
  	//set allowance
  	require(subToken.transfer(newMarketMaker, _totalSupply));
  	require(IEllipseMarketMaker(newMarketMaker).initializeAfterTransfer());
  	currencyMap[subToken] = CurrencyStruct({ name: _name, decimals: _decimals, totalSupply: _totalSupply, mmAddress: newMarketMaker, owner: msg.sender});
    tokens.push(subToken);
  	TokenCreated(subToken, msg.sender);
  	return subToken;
  }

  /// @dev create the MarketMaker and the CC token put all the CC token in the Market Maker reserve
  /// @param _name string name for CC token that is created.
  /// @param _symbol string symbol for CC token that is created.
  /// @param _decimals uint8 percison for CC token that is created.
  /// @param _totalSupply uint256 total supply of the CC token that is created.
  function createCurrency(string _name,
                          string _symbol,
                          uint8 _decimals,
                          uint256 _totalSupply) public
                          returns (address) {
    return createCurrency(_name, _symbol, _decimals, _totalSupply, '');
  }

  /// @dev normal send cln to the market maker contract, sender must approve() before calling method. can only be called by owner
  /// @dev sending CLN will return CC from the reserve to the sender.
  /// @param _token address address of the cc token managed by this factory.
  /// @param _clnAmount uint256 amount of CLN to transfer into the Market Maker reserve.
  function insertCLNtoMarketMaker(address _token,
                                  uint256 _clnAmount) public
                                  tokenIssuerOnly(_token, msg.sender)
                                  returns (uint256 _subTokenAmount) {
  	require(_clnAmount > 0);
  	address marketMakerAddress = getMarketMakerAddressFromToken(_token);
  	require(ERC20(clnAddress).transferFrom(msg.sender, this, _clnAmount));
  	require(ERC20(clnAddress).approve(marketMakerAddress, _clnAmount));
  	_subTokenAmount = IEllipseMarketMaker(marketMakerAddress).change(clnAddress, _clnAmount, _token);
    require(ERC20(_token).transfer(msg.sender, _subTokenAmount));
  }

  /// @dev ERC223 transferAndCall, send cln to the market maker contract can only be called by owner (see MarketMaker)
  /// @dev sending CLN will return CC from the reserve to the sender.
  /// @param _token address address of the cc token managed by this factory.
  function insertCLNtoMarketMaker(address _token) public
                                  tokenPayable
                                  CLNOnly
                                  tokenIssuerOnly(_token, tkn.sender)
                                  returns (uint256 _subTokenAmount) {
  	address marketMakerAddress = getMarketMakerAddressFromToken(_token);
  	require(ERC20(clnAddress).approve(marketMakerAddress, tkn.value));
  	_subTokenAmount = IEllipseMarketMaker(marketMakerAddress).change(clnAddress, tkn.value, _token);
    require(ERC20(_token).transfer(tkn.sender, _subTokenAmount));
  }

  /// @dev normal send cc to the market maker contract, sender must approve() before calling method. can only be called by owner
  /// @dev sending CC will return CLN from the reserve to the sender.
  /// @param _token address address of the cc token managed by this factory.
  /// @param _ccAmount uint256 amount of CC to transfer into the Market Maker reserve.
  function extractCLNfromMarketMaker(address _token,
                                     uint256 _ccAmount) public
                                     tokenIssuerOnly(_token, msg.sender)
                                     returns (uint256 _clnTokenAmount) {
  	address marketMakerAddress = getMarketMakerAddressFromToken(_token);
  	require(ERC20(_token).transferFrom(msg.sender, this, _ccAmount));
  	require(ERC20(_token).approve(marketMakerAddress, _ccAmount));
  	_clnTokenAmount = IEllipseMarketMaker(marketMakerAddress).change(_token, _ccAmount, clnAddress);
  	require(ERC20(clnAddress).transfer(msg.sender, _clnTokenAmount));
  }

  /// @dev ERC223 transferAndCall, send CC to the market maker contract can only be called by owner (see MarketMaker)
  /// @dev sending CC will return CLN from the reserve to the sender.
  function extractCLNfromMarketMaker() public
                                    tokenPayable
                                    tokenIssuerOnly(msg.sender, tkn.sender)
                                    returns (uint256 _clnTokenAmount) {
  	address marketMakerAddress = getMarketMakerAddressFromToken(msg.sender);
  	require(ERC20(msg.sender).approve(marketMakerAddress, tkn.value));
  	_clnTokenAmount = IEllipseMarketMaker(marketMakerAddress).change(msg.sender, tkn.value, clnAddress);
  	require(ERC20(clnAddress).transfer(tkn.sender, _clnTokenAmount));
  }

  /// @dev opens the Market Maker to recvice transactions from all sources.
  /// @dev Request to transfer ownership of Market Maker contract to Owner instead of factory.
  /// @param _token address address of the cc token managed by this factory.
  function openMarket(address _token) public
                      tokenIssuerOnly(_token, msg.sender)
                      returns (bool) {
  	address marketMakerAddress = getMarketMakerAddressFromToken(_token);
  	require(MarketMaker(marketMakerAddress).openForPublicTrade());
  	Ownable(marketMakerAddress).requestOwnershipTransfer(msg.sender);
    Ownable(_token).requestOwnershipTransfer(msg.sender);
  	MarketOpen(marketMakerAddress);
  	return true;
  }

  /// @dev implementation for standard 223 reciver.
  /// @param _token address of the token used with transferAndCall.
  function supportsToken(address _token) public constant returns (bool) {
  	return (clnAddress == _token || currencyMap[_token].totalSupply > 0);
  }

  /// @dev sets tokenURI for the given currency, can be used during the sell only
  /// @param _token address address of the token to update
  /// @param _tokenURI string the URI may point to a JSON file that conforms to the "Metadata JSON Schema".
  function setTokenURI(address _token, string _tokenURI) public
                              tokenIssuerOnly(_token, msg.sender)
                              marketClosed(_token)
                              returns (bool) {
    ColuLocalCurrency(_token).setTokenURI(_tokenURI);
    return true;
  }

  /// @dev helper function to get the market maker address form token
  /// @param _token address of the token used with transferAndCall.
  function getMarketMakerAddressFromToken(address _token) public constant returns (address _marketMakerAddress) {
  	_marketMakerAddress = currencyMap[_token].mmAddress;
    require(_marketMakerAddress != address(0));
  }
}
