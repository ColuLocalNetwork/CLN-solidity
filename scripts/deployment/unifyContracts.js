var config = require(__dirname + '/config')
var fs = require('fs')
var async = require('async')

// order matters
var contracts = [
	'Ownable.sol',
	'SafeMath.sol',
	'ERC20.sol',
	'BasicToken.sol',
	'TokenHolder.sol',
	'ColuLocalNetwork.sol',
	'VestingTrustee.sol',
	'ColuLocalNetworkSale.sol',
]

var now = +new Date()
var solidityVersion = config.get('solidity').replace('pragma solidity', '').replace(';', '')
var compilerVersion = config.get('compilerVersion')
var unifiedContract = __dirname + '/Unified_' + solidityVersion + '_' + compilerVersion + '_' + now + '.sol'

unifyContracts(err => {
	if(err) return console.error('err =', err)
	console.log('DONE')
})

function unifyContracts(callback) {
	async.waterfall([
		function writeFileWithHeader (callback) {
			// open file for writing, file is created (if it does not exist) or truncated (if it exists)
			fs.writeFile(unifiedContract, config.get('solidity'), {flag: 'w'}, callback)
		},
		function readFiles (callback) {
			async.concat(contracts, readFile, callback)
		},
		function clearFilesBeforeAppend (files, callback) {
			async.map(files, removeStuff, callback)
		},
		function appendToUnified (clearedFiles, callback) {
			async.eachSeries(clearedFiles, appendToFile, callback)
		},
	], callback)

	function readFile(file, cb) {
		fs.readFile(__dirname + '/../../contracts/' + file, 'utf8', cb)
	}

	function removeStuff(file, cb) {
		var cleared = file.replace(config.get('solidity'), '')
		contracts.forEach(contract => {
			cleared = cleared.replace('import \'./' + contract + '\';', '')
		})
		cb(null, cleared)
	}

	function appendToFile(file, cb) {
		fs.appendFile(unifiedContract, file, cb)
	}
}

module.exports = {
	unify: unifyContracts
}