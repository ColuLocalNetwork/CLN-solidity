var config = require('./config')
var fs = require('fs')
var async = require('async')

// order matters
var contracts = [
	'Ownable.sol',
	'SafeMath.sol',
	'ERC20.sol',
	'BasicToken.sol',
	'TokenHolder.sol',
	'TestToken.sol',
	'VestingTrustee.sol',
	'TestTokenSale.sol',
]

var unifiedContract = __dirname + '/../../contracts/Unified.sol'

async.waterfall([
	function truncate (callback) {
		fs.truncate(unifiedContract, 0, callback)
	},
	function writeHeader (callback) {
		fs.writeFile(unifiedContract, config.get('solidity'), callback)
	},
	function readFiles (callback) {
		async.concat(contracts, readFile, callback)
	},
	function clearFilesBeforeAppend (files, callback) {
		async.map(files, removeStuff, callback)
	},
	function appendToUnified (clearedFiles, callback) {
		async.each(clearedFiles, appendToFile, callback)
	},
], err => {
	if(err) return console.error('err =', err)
	console.log('DONE')
})

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