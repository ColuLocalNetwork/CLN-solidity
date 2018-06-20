pragma solidity ^0.4.18;

import "./ECRecovery.sol";
import './Ownable.sol';

contract ProxyWallet is Ownable {
  using ECRecovery for bytes32; 
  // Digest describing the data the user signs.
  // Needs to match what is passed to Metamask.
  bytes32 public constant delegationHash =
    keccak256("address wallet", "address to", "uint256 value", "bytes data", "uint256 nonce");

  uint256 public nonce;

  modifier validNonce (uint256 _nonce) {
    require(_nonce == nonce);
    _;
  }

  function ProxyWallet (address _owner) public {
    owner = _owner;
    nonce = 0;
  }

  function proxyTx (
    bytes _delegationSig,
    address _to,
    uint256 _value,
    bytes _data,
    uint256 _nonce
  ) public validNonce(_nonce) {
    // Recreate the digest the user signed
    bytes32 _delegationDigest = delegationDigest(_to, _value, _data, _nonce);
      
    // // Recover the signer from the digest.
    address signer = recoverSigner(_delegationDigest, _delegationSig);
    // Check that it matches the claimed sender
    require(owner == signer);

    // increase the nonce before execution
    nonce++;

    // Call the actual method
    require(_to.call.value(_value)(_data));
  }

  function delegationDigest (address _to,
    uint256 _value,
    bytes _data,
    uint256 _nonce
  ) public view returns (bytes32) {
    return keccak256(delegationHash, keccak256(this, _to, _value, _data, _nonce));
  }

  function recoverSigner(bytes32 _hash, bytes _sig) public pure returns (address _signer) {
    _signer = _hash.recover(_sig);
  }

  /// @dev Fallback function allows to deposit ether.
  function () public payable { }
}