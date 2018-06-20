var config = require(__dirname + '/../config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var abi = require('ethereumjs-abi')
var async = require('async')
var fs = require('fs')
var unifyContracts = require(__dirname + '/../unifyContracts')

var contracts = [
  'Ownable.sol',
  'ECRecovery.sol',
  'ProxyWallet.sol',
  'ProxyWalletFactory.sol',
]
unifyContracts.unify('ProxyWalletFactory', contracts, function(err, filePath) {
  if(err) return console.error('err =', err)

  console.log('unified contract created at path =', filePath)

  var unifiedContract = fs.readFileSync(filePath, 'utf8')

  solc.loadRemoteVersion(config.get('compilerVersion'), function(err, solcSnapshot) {
    if (err) return console.error('err =', err)

    var contractCompiled = solcSnapshot.compile(unifiedContract, 1)
    var contractObj = contractCompiled.contracts[':ProxyWalletFactory']
    var bytecode = contractObj.bytecode

    var result = '0x' + bytecode

    var bytecodeFilePath = filePath.replace('.sol', '.txt')
    fs.writeFile(bytecodeFilePath, result, {flag: 'w'}, function(err) {
      if(err) return console.error('err =', err)
      console.log('bytecode created at path =', bytecodeFilePath)
    })
  })
})