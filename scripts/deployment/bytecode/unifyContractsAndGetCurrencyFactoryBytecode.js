var config = require(__dirname + '/../config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var abi = require('ethereumjs-abi')
var async = require('async')
var fs = require('fs')
var unifyContracts = require(__dirname + '/../unifyContracts')

var args = require(__dirname + '/../config/CurrencyFactory.json')[config.get('web3Provider')]

var mmLib = args.mmLib
var clnAddress = args.clnAddress

var contracts = [
  'ERC20.sol',
  'BasicToken.sol',
  'ERC677.sol',
  'SafeMath.sol',
  'Standard677Token.sol',
  'Ownable.sol',
  'TokenHolder.sol',
  'ColuLocalCurrency.sol',
  'ERC223Receiver.sol',
  'Standard223Receiver.sol',
  'TokenOwnable.sol',
  'MarketMaker.sol',
  'EllipseMarketMaker.sol',
  'IEllipseMarketMaker.sol',
  'CurrencyFactory.sol'
]
unifyContracts.unify('CurrencyFactory', contracts, function(err, filePath) {
  if(err) return console.error('err =', err)

  console.log('unified contract created at path =', filePath)

  var unifiedContract = fs.readFileSync(filePath, 'utf8')

  solc.loadRemoteVersion(config.get('compilerVersion'), function(err, solcSnapshot) {
    if (err) return console.error('err =', err)

    var contractCompiled = solcSnapshot.compile(unifiedContract, 1)
    var contractObj = contractCompiled.contracts[':CurrencyFactory']
    var bytecode = contractObj.bytecode

    // console.log([mmLib, clnAddress])

    var encoded = abi.rawEncode(['address', 'address'], [mmLib, clnAddress])
    var params = encoded.toString('hex')

    var result = '0x' + bytecode + params

    var bytecodeFilePath = filePath.replace('.sol', '.txt')
    fs.writeFile(bytecodeFilePath, result, {flag: 'w'}, function(err) {
      if(err) return console.error('err =', err)
      console.log('bytecode created at path =', bytecodeFilePath)

      var paramsFilePath = bytecodeFilePath.replace('Unified_', 'UnifiedParams_')
      fs.writeFile(paramsFilePath, params, {flag: 'w'}, function(err) {
        if(err) return console.error('err =', err)
          console.log('params created at path =', paramsFilePath)
      })
    })
  })
})