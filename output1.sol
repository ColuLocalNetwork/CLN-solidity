pragma solidity ^0.4.18;

// File: contracts\ECRecovery.sol

/**
 * @title Eliptic curve signature operations
 *
 * @dev Based on https://gist.github.com/axic/5b33912c6f61ae6fd96d6c4a47afde6d
 *
 * TODO Remove this library once solidity supports passing a signature to ecrecover.
 * See https://github.com/ethereum/solidity/issues/864
 *
 */

library ECRecovery {

  /**
   * @dev Recover signer address from a message by using their signature
   * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
   * @param sig bytes signature, the signature is generated using web3.eth.sign()
   */
  function recover(bytes32 hash, bytes sig)
    internal
    pure
    returns (address)
  {
    bytes32 r;
    bytes32 s;
    uint8 v;

    // Check the signature length
    if (sig.length != 65) {
      return (address(0));
    }

    // Divide the signature in r, s and v variables
    // ecrecover takes the signature parameters, and the only way to get them
    // currently is to use assembly.
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      r := mload(add(sig, 32))
      s := mload(add(sig, 64))
      v := byte(0, mload(add(sig, 96)))
    }

    // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
    if (v < 27) {
      v += 27;
    }

    // If the version is correct return the signer address
    if (v != 27 && v != 28) {
      return (address(0));
    } else {
      // solium-disable-next-line arg-overflow
      return ecrecover(hash, v, r, s);
    }
  }

  /**
   * toEthSignedMessageHash
   * @dev prefix a bytes32 value with "\x19Ethereum Signed Message:"
   * @dev and hash the result
   */
  function toEthSignedMessageHash(bytes32 hash)
    internal
    pure
    returns (bytes32)
  {
    // 32 is the length in bytes of hash,
    // enforced by the type signature above
    return keccak256(
      "\x19Ethereum Signed Message:\n32",
      hash
    );
  }
}

// File: contracts\Ownable.sol

/// @title Ownable
/// @dev The Ownable contract has an owner address, and provides basic authorization control functions,
/// this simplifies the implementation of "user permissions".
/// @dev Based on OpenZeppelin's Ownable.

contract Ownable {
    address public owner;
    address public newOwnerCandidate;

    event OwnershipRequested(address indexed _by, address indexed _to);
    event OwnershipTransferred(address indexed _from, address indexed _to);

    /// @dev Constructor sets the original `owner` of the contract to the sender account.
    function Ownable() public {
        owner = msg.sender;
    }

    /// @dev Reverts if called by any account other than the owner.
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyOwnerCandidate() {
        require(msg.sender == newOwnerCandidate);
        _;
    }

    /// @dev Proposes to transfer control of the contract to a newOwnerCandidate.
    /// @param _newOwnerCandidate address The address to transfer ownership to.
    function requestOwnershipTransfer(address _newOwnerCandidate) external onlyOwner {
        require(_newOwnerCandidate != address(0));

        newOwnerCandidate = _newOwnerCandidate;

        OwnershipRequested(msg.sender, newOwnerCandidate);
    }

    /// @dev Accept ownership transfer. This method needs to be called by the perviously proposed owner.
    function acceptOwnership() external onlyOwnerCandidate {
        address previousOwner = owner;

        owner = newOwnerCandidate;
        newOwnerCandidate = address(0);

        OwnershipTransferred(previousOwner, owner);
    }
}

// File: contracts\ProxyWallet.sol

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

// File: contracts\ProxyWalletFactory.sol

contract ProxyWalletFactory {

  mapping (address => address) public proxies;

  function createProxyWallet(address _owner) public returns (address _proxy) {
    require(_owner != address(0));
    require(proxies[_owner] == address(0));
    _proxy = new ProxyWallet(_owner);
    proxies[_owner] = _proxy;
  }
}
