var config = require('./config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var abi = require('ethereumjs-abi')
var fs = require('fs')
var argv = require('yargs').argv

if (!argv.owners || !argv.required) {
  throw new Error('Must have "owners" and "required" as command line arguments')
}
var owners = argv.owners.split(',')
var required = parseInt(argv.required)

var contract = fs.readFileSync(__dirname + '/../../contracts/MultiSigWallet.sol', 'utf8')

solc.loadRemoteVersion(config.get('compilerVersion'), function(err, solcSnapshot) {
  if (err) return console.error('err =', err)

  var contractCompiled = solcSnapshot.compile(contract, 1)
  var bytecode = contractCompiled.contracts[':MultiSigWallet'].bytecode
  var jsonInterface = JSON.parse(contractCompiled.contracts[':MultiSigWallet'].interface)
  var contractObj = new web3.eth.Contract(jsonInterface)
  var arguments = abi.rawEncode(['address[]', 'uint'], [owners, required]).toString('hex')

  console.log('0x' + bytecode + arguments)
})