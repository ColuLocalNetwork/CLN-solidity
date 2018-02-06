const fs = require('fs')
const parse = require('csv-parse')
const async = require('async')

const BigNumber = require('bignumber.js')
BigNumber.config({ ERRORS: false })

const PresaleCalculator = require(__dirname + '/../presaleCalculator')

const inputFile = __dirname + '/config/presales.csv'

const now = +new Date()

const CLN_PER_ETH = 3900
const presaleCalculator = PresaleCalculator(CLN_PER_ETH)
const presales = []

const parser = parse({delimiter: ', '}, (err, data) => {
	if(err) {
		return console.error('err = ', err)
	}
	async.eachSeries(data, (line, cb) => {
		presales.push({recipient: line[0], dolarInvest: new BigNumber(line[1]), plan: line[2]})
		cb()
	}, function() {
		let formattedPresales = presaleCalculator.calcPresale(presales).map(presale => {
			return [presale[0], presale[1].toString(10,24), presale[2]]
		})
		formattedPresales.unshift(['_recipient', '_etherValue', '_vestingPlanIndex'])
		fs.writeFileSync(__dirname + '/output/formattedPresales_' + now + '.csv', formattedPresales.join('\n'), 'utf8')
	})
})
fs.createReadStream(inputFile).pipe(parser)