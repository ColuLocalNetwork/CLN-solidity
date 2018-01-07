const config = require(__dirname + '/config')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
const fs = require('fs')
const parse = require('csv-parse')
const async = require('async')
const argv = require('yargs').argv

const BigNumber = require('bignumber.js')
BigNumber.config({ ERRORS: false })

const inputFile = __dirname + '/config/grants.csv'

const MINUTE = 60;
const HOUR = 60 * MINUTE; // 3,600
const DAY = 24 * HOUR;    // 86,400
const WEEK = 7 * DAY;     // 604,800
const YEAR = 365 * DAY;   // 31,536,000
const MONTH = YEAR / 12;  // 2,628,000

const decimals = 10 ** 18

const grants = []

let totalTokens = new BigNumber(0)

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
				var tokensWEI = new BigNumber(line[1]).mul(decimals)
				totalTokens = totalTokens.add(tokensWEI)
				grants.push({
					to: line[0],
					tokens: tokensWEI.toString(10,24),
					start: 1515589200, // Wednesday, January 10, 2018 3:00:00 PM GMT+02:00
					cliff: 1515589200 + 3 * DAY,
					end: 1515589200 + 1 * WEEK,
					installmentLength: 1 * DAY,
					revokable: argv.revokable || true
				})
				cb()
			}, function() {
				let formattedGrants = grants.map(grant => {
					return Object.values(grant).join(',')
				})

				fs.writeFileSync(__dirname + '/output/formattedGrants_' + now + '.csv', formattedGrants.join('\n'), 'utf8')
				cb()
			})
		})
		fs.createReadStream(inputFile).pipe(parser)
	}]
}, (err, results) => {
	if (err) {
		return console.error('err =', err)
	}
	console.log('DONE! totalTokens =', totalTokens.toString(10,24))
})

