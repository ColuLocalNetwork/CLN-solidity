module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 8000029
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545
    }
  },
  mocha: {
  	//grep: "presaleAllocation"
  },
  rpc: {
    host: "localhost",
    gas: 8000029 ,
    port: 8545
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
