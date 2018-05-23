const CurrencyFactory = artifacts.require('./CurrencyFactory.sol')
const ColuLocalNetwork = artifacts.require('./ColuLocalNetwork.sol')
const EllipseMarketMakerLib = artifacts.require('./EllipseMarketMakerLib.sol')

module.exports = function (deployer) {
  console.log(deployer.network)
  if (deployer.network === 'development') {
    deployer.deploy(EllipseMarketMakerLib).then(mmContract => {
      const totalSupply = 1540701333592592592592614116
      deployer.deploy(ColuLocalNetwork, totalSupply).then(clnContract => {
        deployer.deploy(CurrencyFactory, mmContract.address, clnContract.address)
      })
    })
  } else if (deployer.network === 'ropsten') {
    deployer.deploy(CurrencyFactory,
      '0x30724fa809d40330eacab9c7ebcfb2a0058c381c',
      '0x41C9d91E96b933b74ae21bCBb617369CBE022530')
  } else if (deployer.network === 'mainnet') {
    deployer.deploy(CurrencyFactory,
      '0xc70636e0886eC4a4F2B7e42aC57ccD1B976352d0',
      '0x4162178B78D6985480A308B2190EE5517460406D')
  }
}
