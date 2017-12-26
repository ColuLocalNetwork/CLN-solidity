pragma solidity 0.4.18;

import './ERC223Receiver.sol';

contract MarketMaker is ERC223Receiver {
    function getPrice(address _fromToken, address _toToken) public constant returns (uint _price);
    function changeAllowance(address _fromToken, address _toToken, uint _amount) public returns (uint _returnAmount);
    function changeAllowance(address _fromToken, address _toToken, uint _amount, uint _minReturn) public returns (uint _returnAmount);
    function change223(address _fromToken, address _toToken, uint _amount) public returns (uint _returnAmount);
    function change223(address _fromToken, address _toToken, uint _amount, uint _minReturn) public returns (uint _returnAmount);
    function quote(address _fromToken, address _toToken, uint _amount) public constant returns (uint _returnAmount);

    event Change(address indexed fromToken, uint inAmount, address indexed toToken, uint returnAmount, address indexed account);
}
