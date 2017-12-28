pragma solidity 0.4.18;

 /* ERC677 additions to ERC20 */

import './ERC677.sol';
import './ERC223Receiver.sol';
import './BasicToken.sol';

contract Standard677Token is ERC677, BasicToken {

  function transferAndCall(address _to, uint _value, bytes _data) public returns (bool) {
    require(super.transfer(_to, _value)); // do a normal token transfer
    TransferAndCall(msg.sender, _to, _value, _data);
    //filtering if the target is a contract with bytecode inside it
    if (isContract(_to)) return contractFallback(msg.sender, _to, _value, _data);
    return true;
  }

  //function that is called when transaction target is a contract
  function contractFallback(address _origin, address _to, uint _value, bytes _data) private returns (bool) {
    ERC223Receiver receiver = ERC223Receiver(_to);
    require(receiver.tokenFallback(msg.sender, _origin, _value, _data));
    return true;
  }

  //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
  function isContract(address _addr) private constant returns (bool is_contract) {
    // retrieve the size of the code on target address, this needs assembly
    uint length;
    assembly { length := extcodesize(_addr) }
    return length > 0;
  }
}