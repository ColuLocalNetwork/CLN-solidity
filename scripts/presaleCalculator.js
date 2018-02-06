const BigNumber = require('bignumber.js');

module.exports = (_tokensPerEth) => {
  const tokensPerEth = new BigNumber(_tokensPerEth);
  const decimals = new BigNumber(10 ** 18);
  const vestingPlansAlapPercent = {'A': 0, 'B': 4, 'C': 12, 'D': 26, 'E': 35};
  return {
    calcPresale: (presales) => {
      return presales.map((presale) => {
        let vestingPlanIndex = presale.plan.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
        let recipient = presale.recipient;
        let alapPercent = vestingPlansAlapPercent[presale.plan.toUpperCase()];

        let ALAPPerEth = tokensPerEth.mul(alapPercent).div(100).floor();
        let tokensAndALAPPerEth = tokensPerEth.add(ALAPPerEth);

        let etherValue = new BigNumber(presale.tokenInvest).mul(decimals).div(tokensAndALAPPerEth).ceil();

        return [recipient, etherValue, vestingPlanIndex];
      })
    }
  }
}