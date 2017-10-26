pragma solidity 0.4.18;

import './Ownable.sol';
import './SafeMath.sol';
import './BasicToken.sol';
import './TokenHolder.sol';

/// @title Test Token contract.
/// @author Tal Beja.
contract TestToken is Ownable, BasicToken, TokenHolder {
    using SafeMath for uint256;

    string public constant name = "Test token";
    string public constant symbol = "TTT";

    // Using same decimal value as ETH (makes ETH-TTT conversion much easier).
    uint8 public constant decimals = 18;

    // States whether tokens transfers allowed or not.
    // Used during token sale.
    bool public isTransferable = false;

    event TokensTransferable();

    modifier transferable() {
        require(isTransferable);
        _;
    }

    modifier notTransferable() {
        require(!isTransferable);
        _;
    }

    /// @dev The TestToken create all tokens and gives them to the owner.
    function TestToken(uint256 _totalSupply) {
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
    /// @param _from address The address which you want to send tokens from.
    /// @param _to address The address which you want to transfer to.
    /// @param _value uint256 the amount of tokens to be transferred.
    function transferFrom(address _from, address _to, uint256 _value) public transferable returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /// @dev Same ERC20 behavior, but for the contract owner transters only during the token sale.
    /// @param _to address The address to transfer to.
    /// @param _value uint256 The amount to be transferred.
    function ownerTransfer(address _to, uint256 _value) public onlyOwner notTransferable returns (bool) {
        return super.transfer(_to, _value);
    }
}