var config = require(__dirname + '/../config')
var solc = require('solc')
var fs = require('fs')

var now = +new Date()
var compilerVersion = config.get('compilerVersion')

var input = {
  'Ownable.sol': fs.readFileSync(__dirname + '/../../../contracts/Ownable.sol', 'utf8'),
  'SafeMath.sol': fs.readFileSync(__dirname + '/../../../contracts/SafeMath.sol', 'utf8'),
  'ERC20.sol': fs.readFileSync(__dirname + '/../../../contracts/ERC20.sol', 'utf8'),
  'ERC677.sol': fs.readFileSync(__dirname + '/../../../contracts/ERC677.sol', 'utf8'),
  'ERC223Receiver.sol': fs.readFileSync(__dirname + '/../../../contracts/ERC223Receiver.sol', 'utf8'),
  'BasicToken.sol': fs.readFileSync(__dirname + '/../../../contracts/BasicToken.sol', 'utf8'),
  'Standard677Token.sol': fs.readFileSync(__dirname + '/../../../contracts/Standard677Token.sol', 'utf8'),
  'TokenHolder.sol': fs.readFileSync(__dirname + '/../../../contracts/TokenHolder.sol', 'utf8'),
  'Standard223Receiver.sol': fs.readFileSync(__dirname + '/../../../contracts/Standard223Receiver.sol', 'utf8'),
  'TokenOwnable.sol': fs.readFileSync(__dirname + '/../../../contracts/TokenOwnable.sol', 'utf8'),
  'ColuLocalCurrency.sol': fs.readFileSync(__dirname + '/../../../contracts/ColuLocalCurrency.sol', 'utf8')
}

solc.loadRemoteVersion(compilerVersion, function(err, solcSnapshot) {
  if (err) return console.error('err =', err)
  var contractCompiled = solcSnapshot.compile({sources: input}, 1)
  var contractObj = contractCompiled.contracts['ColuLocalCurrency.sol:ColuLocalCurrency']
  var abi = contractObj.interface

  var filePath = __dirname + '/../output/ColuLocalCurrencyABI_' + compilerVersion + '_' + now + '.json'

  fs.writeFile(filePath, abi, {flag: 'w'}, function(err) {
    if(err) return console.error('err =', err)
    console.log('abi created at path =', filePath)
  })
})