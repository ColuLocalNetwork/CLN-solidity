pragma solidity 0.4.18;

contract MarketMaker {
    function getPrice(address _fromToken, address _toToken) public constant returns (uint _price);
    function change(address _fromToken, address _toToken, uint _amount, uint _minReturn) public returns (uint _returnAmount);
    function quote(address _fromToken, address _toToken, uint _amount) public constant returns (uint _returnAmount);
}
