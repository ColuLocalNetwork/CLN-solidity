var fs = require('fs')
var parse = require('csv-parse')
var async = require('async')

var BigNumber = require('bignumber.js')
BigNumber.config({ ERRORS: false })

var PresaleCalculator = require(__dirname + '/../../test/helpers/presaleCalculator')

var inputFile = __dirname + '/config/presales.csv'

var TTT_PER_ETH = 3900
var presaleCalculator = PresaleCalculator(TTT_PER_ETH)
var presales = []

var parser = parse({delimiter: ','}, (err, data) => {
	if(err) {
		return console.error('err = ', err)
	}
	async.eachSeries(data, (line, cb) => {
		presales.push({recipient: line[0].replace(' ', ''), dolarInvest: new BigNumber(line[1].replace(' ', '')), plan: line[2].replace(' ', '')})
		cb()
	}, function() {
		var formattedPresales = presaleCalculator.calcPresale(presales).map(presale => {
			return [presale[0], presale[1].toString(10,24), presale[2]]
		})
		var now = +new Date()
		fs.writeFileSync(__dirname + '/formattedPresales' + now + '.csv', formattedPresales.join('\n'), 'utf8')
	})
})
fs.createReadStream(inputFile).pipe(parser)