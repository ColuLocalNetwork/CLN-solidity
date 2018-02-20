var config = require(__dirname + '/config')
var fs = require('fs')
var async = require('async')
var argv = require('yargs').argv

var _contracts = argv.contracts && argv.contracts.split(',') || []

var now = +new Date()
var solidityVersion = config.get('solidity').replace('pragma solidity ', '').replace(';', '')
var compilerVersion = config.get('compilerVersion')

function unifyContracts(name, contracts, cb) {
	var filePath = __dirname + '/output/Unified_' + name + '_' + solidityVersion + '_' + compilerVersion + '_' + now + '.sol'
	async.waterfall([
		function writeFileWithHeader (callback) {
			// open file for writing, file is created (if it does not exist) or truncated (if it exists)
			fs.writeFile(filePath, config.get('solidity'), {flag: 'w'}, callback)
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
	], err => {
		cb(err, filePath)
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
		fs.appendFile(filePath, file, cb)
	}
}

module.exports = {
	unify: unifyContracts
}