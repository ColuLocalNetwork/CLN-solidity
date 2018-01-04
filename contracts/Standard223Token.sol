pragma solidity 0.4.18;

 /* ERC223 additions to ERC20 */

import './ERC223.sol';
import './ERC223Receiver.sol';
import './BasicToken.sol';

contract Standard223Token is ERC223, BasicToken {
  //function that is called when a user or another contract wants to transfer funds
  function transfer(address _to, uint _value, bytes _data) public returns (bool success) {
    require(super.transfer(_to, _value)); // do a normal token transfer
    Transfer(msg.sender, _to, _value, _data);
    //filtering if the target is a contract with bytecode inside it
    if (isContract(_to)) return contractFallback(msg.sender, _to, _value, _data);
    return true;
  }

  function transfer(address _to, uint _value) public returns (bool success) {
    return transfer(_to, _value, new bytes(0));
  }

  //function that is called when transaction target is a contract
  function contractFallback(address _origin, address _to, uint _value, bytes _data) private returns (bool success) {
    ERC223Receiver reciever = ERC223Receiver(_to);
    return reciever.tokenFallback(msg.sender, _origin, _value, _data);
  }

  //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
  function isContract(address _addr) private constant returns (bool is_contract) {
    // retrieve the size of the code on target address, this needs assembly
    uint length;
    assembly { length := extcodesize(_addr) }
    return length > 0;
  }
}