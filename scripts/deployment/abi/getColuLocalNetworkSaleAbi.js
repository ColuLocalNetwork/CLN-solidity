var config = require(__dirname + '/../config')
var solc = require('solc')
var fs = require('fs')

var now = +new Date()
var compilerVersion = config.get('compilerVersion')

var input = {
  'Ownable.sol': fs.readFileSync(__dirname + '/../../../contracts/Ownable.sol', 'utf8'),
  'SafeMath.sol': fs.readFileSync(__dirname + '/../../../contracts/SafeMath.sol', 'utf8'),
  'ERC20.sol': fs.readFileSync(__dirname + '/../../../contracts/ERC20.sol', 'utf8'),
  'BasicToken.sol': fs.readFileSync(__dirname + '/../../../contracts/BasicToken.sol', 'utf8'),
  'TokenHolder.sol': fs.readFileSync(__dirname + '/../../../contracts/TokenHolder.sol', 'utf8'),
  'ColuLocalNetwork.sol': fs.readFileSync(__dirname + '/../../../contracts/ColuLocalNetwork.sol', 'utf8'),
  'VestingTrustee.sol': fs.readFileSync(__dirname + '/../../../contracts/VestingTrustee.sol', 'utf8'),
  'ColuLocalNetworkSale.sol': fs.readFileSync(__dirname + '/../../../contracts/ColuLocalNetworkSale.sol', 'utf8'),
}

solc.loadRemoteVersion(compilerVersion, function(err, solcSnapshot) {
  if (err) return console.error('err =', err)
  var contractCompiled = solcSnapshot.compile({sources: input}, 1)
  var contractObj = contractCompiled.contracts['ColuLocalNetworkSale.sol:ColuLocalNetworkSale']
  var abi = contractObj.interface

  var filePath = __dirname + '/../output/ColuLocalNetworkSaleABI_' + compilerVersion + '_' + now + '.json'

  fs.writeFile(filePath, abi, {flag: 'w'}, function(err) {
    if(err) return console.error('err =', err)
    console.log('abi created at path =', filePath)
  })
})