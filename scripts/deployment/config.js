var defaults ={
  // web3Provider: 'http://localhost:8545',
  web3Provider: 'https://ethrpc.colu.co',
  // web3Provider: 'https://ropsten.colu.com',
  compilerVersion: 'v0.4.18+commit.9cf6e910',
  solidity: 'pragma solidity 0.4.18;'
}

module.exports = {
  get: function (key) {
    return defaults[key]
  }
}