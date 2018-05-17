pragma solidity ^0.4.18;

import './Ownable.sol';
import './SafeMath.sol';
import './Standard677Token.sol';
import './TokenHolder.sol';

/// @title Colu Local Currency contract.
/// @author Rotem Lev.
contract ColuLocalCurrency is Ownable, Standard677Token, TokenHolder {
    using SafeMath for uint256;
    string public name;
    string public symbol;
    uint8 public decimals;
    string public tokenURI;

    event TokenURIChanged(string newTokenURI);

    /// @dev cotract to use when issuing a CC (Local Currency)
    /// @param _name string name for CC token that is created.
    /// @param _symbol string symbol for CC token that is created.
    /// @param _decimals uint8 percison for CC token that is created.
    /// @param _totalSupply uint256 total supply of the CC token that is created.
    /// @param _tokenURI string the URI may point to a JSON file that conforms to the "Metadata JSON Schema".
    function ColuLocalCurrency(string _name, string _symbol, uint8 _decimals, uint256 _totalSupply, string _tokenURI) public {
        require(_totalSupply != 0);
        require(bytes(_name).length != 0);
        require(bytes(_symbol).length != 0);

        totalSupply = _totalSupply;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        tokenURI = _tokenURI;
        balances[msg.sender] = totalSupply;
    }

    /// @dev Sets the tokenURI field, can be called by the owner only
    /// @param _tokenURI string the URI may point to a JSON file that conforms to the "Metadata JSON Schema".
    function setTokenURI(string _tokenURI) public onlyOwner {
      tokenURI = _tokenURI;
      TokenURIChanged(_tokenURI);
    }
}
