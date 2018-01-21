var config = require(__dirname + '/../config')
var solc = require('solc')
var abi = require('ethereumjs-abi')
var fs = require('fs')
var argv = require('yargs').argv

var now = +new Date()
var compilerVersion = config.get('compilerVersion')

var input = {
  'MultiSigWallet.sol': fs.readFileSync(__dirname + '/../../../contracts/MultiSigWallet.sol', 'utf8'),
  'MultiSigWalletWithDailyLimit.sol': fs.readFileSync(__dirname + '/../../../contracts/MultiSigWalletWithDailyLimit.sol', 'utf8')
}

solc.loadRemoteVersion(compilerVersion, function(err, solcSnapshot) {
  if (err) return console.error('err =', err)

  var contractCompiled = solc.compile({sources: input}, 1)
  var contractObj = contractCompiled.contracts['MultiSigWalletWithDailyLimit.sol:MultiSigWalletWithDailyLimit']
  var abi = contractObj.interface

  var filePath = __dirname + '/../output/MultiSigWalletWithDailyLimitABI_' + compilerVersion + '_' + now + '.json'
  fs.writeFile(filePath, abi, {flag: 'w'}, function(err) {
    if(err) return console.error('err =', err)
    console.log('abi created at path =', filePath)
  })
})