pragma solidity ^0.4.18;

import './ProxyWallet.sol';

contract ProxyWalletFactory {

  mapping (address => address) public proxies;

  function createProxyWallet(address _owner) public returns (address _proxy) {
    require(_owner != address(0));
    require(proxies[_owner] == address(0));
    _proxy = new ProxyWallet(_owner);
    proxies[_owner] = _proxy;
  }
}