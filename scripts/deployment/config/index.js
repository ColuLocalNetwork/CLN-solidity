var defaults ={
  // web3Provider: 'http://localhost:8545',
  // web3Provider: 'https://ethrpc.colu.co',
  web3Provider: 'https://ropsten.colu.com',
  compilerVersion: 'latest',
  solidity: 'pragma solidity 0.4.18;',
  startTimeOffsetSeconds: 24*60*60
}

module.exports = {
  get: function (key) {
    return defaults[key]
  }
}