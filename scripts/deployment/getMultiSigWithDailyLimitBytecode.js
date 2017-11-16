var config = require(__dirname + '/config')
var solc = require('solc')
var abi = require('ethereumjs-abi')
var fs = require('fs')
var argv = require('yargs').argv

if (!argv.owners || !argv.required || !argv.dailyLimitWEI) {
  throw new Error('Must have "owners", "required" and "dailyLimitWEI" as command line arguments')
}
var owners = argv.owners.split(',')
var required = parseInt(argv.required, 10)
var dailyLimitWEI = argv.dailyLimitWEI

var input = {
  'MultiSigWallet.sol': fs.readFileSync(__dirname + '/../../contracts/MultiSigWallet.sol', 'utf8'),
  'MultiSigWalletWithDailyLimit.sol': fs.readFileSync(__dirname + '/../../contracts/MultiSigWalletWithDailyLimit.sol', 'utf8')
}

solc.loadRemoteVersion(config.get('compilerVersion'), function(err, solcSnapshot) {
  if (err) return console.error('err =', err)

  var contractCompiled = solc.compile({sources: input}, 1)
  var contractObj = contractCompiled.contracts['MultiSigWalletWithDailyLimit.sol:MultiSigWalletWithDailyLimit']
  var bytecode = contractObj.bytecode
  var arguments = abi.rawEncode(['address[]', 'uint', 'uint'], [owners, required, dailyLimitWEI.toString()]).toString('hex')

  console.log('0x' + bytecode + arguments)
})