var config = require(__dirname + '/config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var async = require('async')
var fs = require('fs')
var argv = require('yargs').argv
if (!argv.owners || !argv.required || !argv.dailyLimitWEI) {
  throw new Error('Must have "owners", "required" and "dailyLimitWEI" as command line arguments')
}
var owners = argv.owners.split(',')
var required = parseInt(argv.required, 10)
var dailyLimitWEI = parseInt(argv.dailyLimitWEI, 10)

var input = {
  'MultiSigWallet.sol': fs.readFileSync(__dirname + '/../../contracts/MultiSigWallet.sol', 'utf8'),
  'MultiSigWalletWithDailyLimit.sol': fs.readFileSync(__dirname + '/../../contracts/MultiSigWalletWithDailyLimit.sol', 'utf8')
}

var deployTransactionObj
var data
var myContract
var constructorArguments = [owners, required, dailyLimitWEI]
async.auto({
  getFromAddress: function (cb) {
    if (argv.from) return cb(null, argv.from)
    web3.eth.getCoinbase(cb)
  },
  loadCompilerVersion: function (cb) {
    solc.loadRemoteVersion(config.get('compilerVersion'), cb)
  },
  getGasPrice: web3.eth.getGasPrice,
  estimateGas: ['loadCompilerVersion', function (results, cb) {
    var solcSnapshot = results.loadCompilerVersion
    var contractCompiled = solc.compile({sources: input}, 1)
    var contractObj = contractCompiled.contracts['MultiSigWalletWithDailyLimit.sol:MultiSigWalletWithDailyLimit']
    var jsonInterface = JSON.parse(contractObj.interface)
    myContract = new web3.eth.Contract(jsonInterface);
    data = '0x' + contractObj.bytecode
    var deployObj = {
      data: data,
      arguments: constructorArguments
    }
    deployTransactionObj = myContract.deploy(deployObj)
    deployTransactionObj.estimateGas(cb)
  }],
  sendTransaction: ['getFromAddress', 'getGasPrice', 'estimateGas', function (results, cb) {
    var from = results.getFromAddress
    var gas = results.estimateGas
    var gasPrice = results.getGasPrice
    console.log('from: %s, gas: %s, gasPrice: %s', from, gas, gasPrice)
    deployTransactionObj.send({
      from,
      gas,
      gasPrice
    }, cb)
  }],
}, function (err, results) {
  if (err) return console.error('err =', err)
  console.log('Success! transactionHash =', results.sendTransaction)
})