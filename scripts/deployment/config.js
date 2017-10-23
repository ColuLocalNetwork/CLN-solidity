var defaults ={
  // web3Provider: 'http://localhost:8545',
  web3Provider: 'https://ethrpc.colu.co'
}

module.exports = {
  get: function (key) {
    return defaults[key]
  }
}