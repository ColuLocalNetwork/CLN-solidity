var config = require('./config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var abi = require('ethereumjs-abi')
var async = require('async')
var fs = require('fs')

var args = require('./TestTokenSale.json')
var owner = args.owner
var fundingRecipient = args.fundingRecipient
var communityPoolAddress = args.communityPoolAddress
var futureDevelopmentPoolAddress = args.futureDevelopmentPoolAddress
var teamPoolAddress = args.teamPoolAddress
var startTime

web3.eth.getBlockNumber(function(err, lastBlock) {
  if(err) return console.error("err =", err)
  web3.eth.getBlock(lastBlock, function(err, data) {
    if(err) return console.error("err =", err)
    var now = data.timestamp

    startTime = args.startTime || (now + 3600)

    var input = {
      'BasicToken.sol': fs.readFileSync(__dirname + '/../../contracts/BasicToken.sol', 'utf8'),
      'ERC20.sol': fs.readFileSync(__dirname + '/../../contracts/ERC20.sol', 'utf8'),
      'Ownable.sol': fs.readFileSync(__dirname + '/../../contracts/Ownable.sol', 'utf8'),
      'SafeMath.sol': fs.readFileSync(__dirname + '/../../contracts/SafeMath.sol', 'utf8'),
      'TestToken.sol': fs.readFileSync(__dirname + '/../../contracts/TestToken.sol', 'utf8'),
      'TokenHolder.sol': fs.readFileSync(__dirname + '/../../contracts/TokenHolder.sol', 'utf8'),
      'VestingTrustee.sol': fs.readFileSync(__dirname + '/../../contracts/VestingTrustee.sol', 'utf8'),
      'TestTokenSale.sol': fs.readFileSync(__dirname + '/../../contracts/TestTokenSale.sol', 'utf8'),
    }

    var contractCompiled = solc.compile({sources: input}, 1)
    var contractObj = contractCompiled.contracts['TestTokenSale.sol:TestTokenSale']
    var bytecode = contractObj.bytecode

    // console.log([owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, teamPoolAddress, startTime])

    var encoded = abi.rawEncode(['address', 'address', 'address', 'address', 'address', 'uint256'], [owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, teamPoolAddress, startTime])
    var params = encoded.toString('hex')

    console.log('0x' + bytecode + params)
  })
})