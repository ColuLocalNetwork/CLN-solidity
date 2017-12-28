pragma solidity 0.4.18;

import './Ownable.sol';
import './SafeMath.sol';
import './Standard223Token.sol';
import './TokenHolder.sol';

/// @title Colu Local Network contract.
/// @author Tal Beja.
contract ColuLocalNetwork is Ownable, Standard223Token, TokenHolder {
    using SafeMath for uint256;

    string public constant name = "Colu Local Network";
    string public constant symbol = "CLN";

    // Using same decimals value as ETH (makes ETH-CLN conversion much easier).
    uint8 public constant decimals = 18;

    // States whether token transfers is allowed or not.
    // Used during token sale.
    bool public isTransferable = false;

    event TokensTransferable();

    modifier transferable() {
        require(msg.sender == owner || isTransferable);
        _;
    }

    /// @dev Creates all tokens and gives them to the owner.
    function ColuLocalNetwork(uint256 _totalSupply) public {
        totalSupply = _totalSupply;
        balances[msg.sender] = totalSupply;
    }

    /// @dev start transferable mode.
    function makeTokensTransferable() external onlyOwner {
        if (isTransferable) {
            return;
        }

        isTransferable = true;

        TokensTransferable();
    }

    /// @dev Same ERC20 behavior, but reverts if not transferable.
    /// @param _spender address The address which will spend the funds.
    /// @param _value uint256 The amount of tokens to be spent.
    function approve(address _spender, uint256 _value) public transferable returns (bool) {
        return super.approve(_spender, _value);
    }

    /// @dev Same ERC20 behavior, but reverts if not transferable.
    /// @param _to address The address to transfer to.
    /// @param _value uint256 The amount to be transferred.
    function transfer(address _to, uint256 _value) public transferable returns (bool) {
        return super.transfer(_to, _value);
    }

    /// @dev Same ERC20 behavior, but reverts if not transferable.
    /// @param _from address The address to send tokens from.
    /// @param _to address The address to transfer to.
    /// @param _value uint256 the amount of tokens to be transferred.
    function transferFrom(address _from, address _to, uint256 _value) public transferable returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /// @dev Same ERC223 behavior, but reverts if not transferable.
    /// @param _to address The address to transfer to.
    /// @param _value uint256 The amount to be transferred.
    /// @param _data bytes data to send to receiver if it is a contract.
    function transfer(address _to, uint _value, bytes _data) public transferable returns (bool success) {
      return super.transfer(_to, _value, _data);
    }

    /// @dev Same ERC223 behavior, but reverts if not transferable.
    /// @param _from address The address to send tokens from.
    /// @param _to address The address to transfer to.
    /// @param _value uint256 the amount of tokens to be transferred.
    /// @param _data bytes data to send to receiver if it is a contract.
    function transferFrom(address _from, address _to, uint _value, bytes _data) public transferable returns (bool success) {
      return super.transferFrom(_from, _to, _value, _data);
    }
}