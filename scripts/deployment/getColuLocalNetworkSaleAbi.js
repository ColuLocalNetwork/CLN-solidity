var config = require('./config')
var solc = require('solc')
var fs = require('fs')

var input = {
  'BasicToken.sol': fs.readFileSync(__dirname + '/../../contracts/BasicToken.sol', 'utf8'),
  'ERC20.sol': fs.readFileSync(__dirname + '/../../contracts/ERC20.sol', 'utf8'),
  'Ownable.sol': fs.readFileSync(__dirname + '/../../contracts/Ownable.sol', 'utf8'),
  'SafeMath.sol': fs.readFileSync(__dirname + '/../../contracts/SafeMath.sol', 'utf8'),
  'ColuLocalNetwork.sol': fs.readFileSync(__dirname + '/../../contracts/ColuLocalNetwork.sol', 'utf8'),
  'TokenHolder.sol': fs.readFileSync(__dirname + '/../../contracts/TokenHolder.sol', 'utf8'),
  'UpgradeableToken.sol': fs.readFileSync(__dirname + '/../../contracts/UpgradeableToken.sol', 'utf8'),
  'UpgradeAgent.sol': fs.readFileSync(__dirname + '/../../contracts/UpgradeAgent.sol', 'utf8'),
  'VestingTrustee.sol': fs.readFileSync(__dirname + '/../../contracts/VestingTrustee.sol', 'utf8'),
  'ColuLocalNetworkSale.sol': fs.readFileSync(__dirname + '/../../contracts/ColuLocalNetworkSale.sol', 'utf8'),
}

solc.loadRemoteVersion(config.get('compilerVersion'), function(err, solcSnapshot) {
	if (err) return console.error('err =', err)
	var contractCompiled = solcSnapshot.compile({sources: input}, 1)
	var contractObj = contractCompiled.contracts['ColuLocalNetworkSale.sol:ColuLocalNetworkSale']
	var abi = contractObj.interface

	console.log(abi)
})