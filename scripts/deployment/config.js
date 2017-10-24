var defaults ={
  // web3Provider: 'http://localhost:8545',
  web3Provider: 'https://ethrpc.colu.co',
  compilerVersion: 'v0.4.18+commit.9cf6e910'
}

module.exports = {
  get: function (key) {
    return defaults[key]
  }
}