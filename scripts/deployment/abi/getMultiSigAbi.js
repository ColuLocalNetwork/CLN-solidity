var config = require(__dirname + '/../config')
var solc = require('solc')
var abi = require('ethereumjs-abi')
var fs = require('fs')
var argv = require('yargs').argv

var now = +new Date()
var compilerVersion = config.get('compilerVersion')

var contract = fs.readFileSync(__dirname + '/../../../contracts/MultiSigWallet.sol', 'utf8')

solc.loadRemoteVersion(compilerVersion, function(err, solcSnapshot) {
  if (err) return console.error('err =', err)

  var contractCompiled = solcSnapshot.compile(contract, 1)
  var contractObj = contractCompiled.contracts[':MultiSigWallet']
  var abi = contractObj.interface

  var filePath = __dirname + '/../output/MultiSigWalletABI_' + compilerVersion + '_' + now + '.json'
  fs.writeFile(filePath, abi, {flag: 'w'}, function(err) {
    if(err) return console.error('err =', err)
    console.log('abi created at path =', filePath)
  })
})