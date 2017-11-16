const BigNumber = require('bignumber.js');

module.exports = (_tokensPerEth) => {
  const tokensPerEth = _tokensPerEth;
  const clnTokenUsdPriceSigDig = 95238095238095238;
  const decimals = 10 ** 18
  return {
    calcPresale: (presales) => {
      return presales.map((presale) => {
        let vestingPlanIndex = presale.plan.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
        let recipient = presale.recipient;
        let etherValue = new BigNumber(presale.dolarInvest).mul(decimals).mul(decimals).div(clnTokenUsdPriceSigDig * tokensPerEth).round();
        return [recipient, etherValue, vestingPlanIndex];
      })
    }
  }
}