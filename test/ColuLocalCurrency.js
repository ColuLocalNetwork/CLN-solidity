const assert = require('chai').assert

const expectRevert = require('./helpers/expectRevert')

const ColuLocalCurrency = artifacts.require('ColuLocalCurrency')

const TOKEN_DECIMALS = 10 ** 18

const MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS

contract('ColuLocalCurrency', (accounts) => {
  let cc

  let owner = accounts[0]
  let notOwner = accounts[1]

  describe('construction', () => {
    it('should not construct without a name', async () => {
      await expectRevert(ColuLocalCurrency.new('', 'MC', 18, MAX_TOKENS, 'ipfs://hash', {from: owner}))
    })

    it('should not construct without a symbol', async () => {
      await expectRevert(ColuLocalCurrency.new('MasterCoin', '', 18, MAX_TOKENS, 'ipfs://hash', {from: owner}))
    })

    it('should not construct without a totalSupply', async () => {
      await expectRevert(ColuLocalCurrency.new('MasterCoin', 'MC', 18, 0, 'ipfs://hash', {from: owner}))
    })

    it('should be able to construct currency with all args', async () => {
      const cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 18, MAX_TOKENS, 'ipfs://hash', {from: owner})
      assert.equal((await cc.name()), 'MasterCoin')
      assert.equal((await cc.symbol()), 'MC')
      assert.equal((await cc.decimals()), 18)
      assert.equal((await cc.totalSupply()), MAX_TOKENS)
      assert.equal((await cc.tokenURI()), 'ipfs://hash')
      assert.equal((await cc.owner()), owner)
    })

    it('should be able to construct currency without decimals', async () => {
      const cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 0, MAX_TOKENS, 'ipfs://hash', {from: owner})
      assert.equal((await cc.decimals()), 0)
    })

    it('should be able to construct currency without metadata', async () => {
      const cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 18, MAX_TOKENS, '', {from: owner})
      assert.equal((await cc.tokenURI()), '')
    })
  })

  describe('actions', () => {
    beforeEach(async () => {
      cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 0, MAX_TOKENS, 'ipfs://hash', {from: owner})
    })

    describe('metadata', () => {
      it('owner should be able to update metadata', async () => {
        let result = await cc.setTokenURI('ipfs://newhash', {from: owner})
        assert.equal((await cc.tokenURI()), 'ipfs://newhash')

        assert.equal(result.logs.length, 1)
        assert.equal(result.logs[0].event, 'TokenURIChanged')
        assert.equal(result.logs[0].args.newTokenURI, 'ipfs://newhash')
      })

      it('not owner should not be able to update metadata', async () => {
        await expectRevert(cc.setTokenURI('ipfs://newhash', {from: notOwner}))
      })
    })
  })
})
