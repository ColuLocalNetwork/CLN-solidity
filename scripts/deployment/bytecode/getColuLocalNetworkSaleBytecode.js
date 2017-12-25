var config = require(__dirname + '/../config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var abi = require('ethereumjs-abi')
var async = require('async')
var fs = require('fs')

var now = +new Date()
var compilerVersion = config.get('compilerVersion')

var args = require(__dirname + '/../config/ColuLocalNetworkSale.json')[config.get('web3Provider')]
var owner = args.owner
var fundingRecipient = args.fundingRecipient
var communityPoolAddress = args.communityPoolAddress
var futureDevelopmentPoolAddress = args.futureDevelopmentPoolAddress
var stakeholdersPoolAddress = args.stakeholdersPoolAddress
var startTime

web3.eth.getBlockNumber(function(err, lastBlock) {
  if(err) return console.error("err =", err)
  web3.eth.getBlock(lastBlock, function(err, data) {
    if(err) return console.error("err =", err)

    startTime = args.startTime || (data.timestamp + config.get('startTimeOffsetSeconds'))

    var input = {
      'Ownable.sol': fs.readFileSync(__dirname + '/../../../contracts/Ownable.sol', 'utf8'),
      'SafeMath.sol': fs.readFileSync(__dirname + '/../../../contracts/SafeMath.sol', 'utf8'),
      'ERC20.sol': fs.readFileSync(__dirname + '/../../../contracts/ERC20.sol', 'utf8'),
      'ERC677.sol': fs.readFileSync(__dirname + '/../../../contracts/ERC677.sol', 'utf8'),
      'ERC223Receiver.sol': fs.readFileSync(__dirname + '/../../../contracts/ERC223Receiver.sol', 'utf8'),
      'BasicToken.sol': fs.readFileSync(__dirname + '/../../../contracts/BasicToken.sol', 'utf8'),
      'Standard677Token.sol': fs.readFileSync(__dirname + '/../../../contracts/Standard677Token.sol', 'utf8'),
      'TokenHolder.sol': fs.readFileSync(__dirname + '/../../../contracts/TokenHolder.sol', 'utf8'),
      'ColuLocalNetwork.sol': fs.readFileSync(__dirname + '/../../../contracts/ColuLocalNetwork.sol', 'utf8'),
      'Standard223Receiver.sol': fs.readFileSync(__dirname + '/../../../contracts/Standard223Receiver.sol', 'utf8'),
      'TokenOwnable.sol': fs.readFileSync(__dirname + '/../../../contracts/TokenOwnable.sol', 'utf8'),
      'VestingTrustee.sol': fs.readFileSync(__dirname + '/../../../contracts/VestingTrustee.sol', 'utf8'),
      'ColuLocalNetworkSale.sol': fs.readFileSync(__dirname + '/../../../contracts/ColuLocalNetworkSale.sol', 'utf8')
    }

    solc.loadRemoteVersion(compilerVersion, function(err, solcSnapshot) {
      if (err) return console.error('err =', err)

      var contractCompiled = solcSnapshot.compile({sources: input}, 1)
      var contractObj = contractCompiled.contracts['ColuLocalNetworkSale.sol:ColuLocalNetworkSale']
      var bytecode = contractObj.bytecode

      // console.log([owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, startTime])

      var encoded = abi.rawEncode(['address', 'address', 'address', 'address', 'address', 'uint256'], [owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, startTime])
      var params = encoded.toString('hex')

      var result = '0x' + bytecode + params

      var filePath = __dirname + '/../output/ColuLocalNetworkSale_' + compilerVersion + '_' + now + '.txt'
      fs.writeFile(filePath, result, {flag: 'w'}, function(err) {
        if(err) return console.error('err =', err)
        console.log('bytecode created at path =', filePath)
      })
    })
  })
})