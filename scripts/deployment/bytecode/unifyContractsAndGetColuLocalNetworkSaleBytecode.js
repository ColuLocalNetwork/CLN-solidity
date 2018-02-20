var config = require(__dirname + '/../config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var abi = require('ethereumjs-abi')
var async = require('async')
var fs = require('fs')
var unifyContracts = require(__dirname + '/../unifyContracts')

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
    var now = data && data.timestamp

    startTime = args.startTime || (now + config.get('startTimeOffsetSeconds'))

    var contracts = [
      'Ownable.sol',
      'SafeMath.sol',
      'ERC20.sol',
      'ERC677.sol',
      'ERC223Receiver.sol',
      'BasicToken.sol',
      'Standard677Token.sol',
      'TokenHolder.sol',
      'ColuLocalNetwork.sol',
      'Standard223Receiver.sol',
      'TokenOwnable.sol',
      'VestingTrustee.sol',
      'ColuLocalNetworkSale.sol'
    ]
    unifyContracts.unify('ColuLocalNetworkSale', contracts, function(err, filePath) {
      if(err) return console.error('err =', err)

      console.log('unified contract created at path =', filePath)

      var unifiedContract = fs.readFileSync(filePath, 'utf8')

      solc.loadRemoteVersion(config.get('compilerVersion'), function(err, solcSnapshot) {
        if (err) return console.error('err =', err)

        var contractCompiled = solcSnapshot.compile(unifiedContract, 1)
        var contractObj = contractCompiled.contracts[':ColuLocalNetworkSale']
        var bytecode = contractObj.bytecode

        // console.log([owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, startTime])

        var encoded = abi.rawEncode(['address', 'address', 'address', 'address', 'address', 'uint256'], [owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, startTime])
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
  })
})