const BigNumber = require('bignumber.js');

module.exports = (_tokensPerEth) => {
  const tokensPerEth = new BigNumber(_tokensPerEth);
  const clnTokenUsdPriceSigDig = new BigNumber('95238095200000000');
  const decimals = new BigNumber(10 ** 18);
  return {
    calcPresale: (presales) => {
      return presales.map((presale) => {
        let vestingPlanIndex = presale.plan.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
        let recipient = presale.recipient;

        let tokensToReceive = new BigNumber(presale.dolarInvest).mul(decimals).mul(decimals).div(clnTokenUsdPriceSigDig);
        let etherValue = tokensToReceive.div(tokensPerEth).ceil();

        return [recipient, etherValue, vestingPlanIndex];
      })
    }
  }
}