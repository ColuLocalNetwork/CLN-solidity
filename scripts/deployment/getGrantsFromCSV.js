const config = require(__dirname + '/config')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
const fs = require('fs')
const parse = require('csv-parse')
const async = require('async')
const argv = require('yargs').argv

const inputFile = __dirname + '/config/grants.csv'

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 12 * MONTH

const grants = []

let totalTokens = 0

async.auto({
	getBlockNumber: web3.eth.getBlockNumber,
	getBlock: ['getBlockNumber', (results, cb) => {
		web3.eth.getBlock(results.getBlockNumber, cb)
	}],
	grants: ['getBlock', (results, cb) => {
		const now = results.getBlock.timestamp
		const parser = parse({delimiter: ', '}, (err, data) => {
			if(err) {
				return console.error('err = ', err)
			}
			async.eachSeries(data, (line, cb) => {
				grants.push({
					to: line[0],
					tokens: line[1],
					start: argv.start || now,
					cliff: argv.cliff || (6*MONTH),
					end: argv.end || (now + 3*YEAR),
					installmentLength: argv.installmentLength || (1*MONTH),
					revokable: argv.revokable || true
				})
				cb()
			}, function() {
				let formattedGrants = grants.map(grant => {
					totalTokens += parseInt(grant.tokens, 10)
					return Object.values(grant).join(',')
				})

				fs.writeFileSync(__dirname + '/formattedGrants' + now + '.csv', formattedGrants.join('\n'), 'utf8')
				cb()
			})
		})
		fs.createReadStream(inputFile).pipe(parser)
	}]
}, (err, results) => {
	if (err) {
		return console.error('err =', err)
	}
	console.log('DONE! totalTokens =', totalTokens)
})

