const CurrencyFactory = artifacts.require("./CurrencyFactory.sol")

module.exports = function(deployer) {
   deployer.deploy(CurrencyFactory, "0x30724fa809d40330eacab9c7ebcfb2a0058c381c", "0x41C9d91E96b933b74ae21bCBb617369CBE022530");
};
