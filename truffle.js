module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4712388
    }
  },
  mocha: {
  	//grep: "presaleAllocation"
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};