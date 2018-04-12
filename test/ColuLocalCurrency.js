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
      await expectRevert(ColuLocalCurrency.new('', 'MC', 18, MAX_TOKENS, 'metadatahash', {from: owner}))
    })

    it('should not construct without a symbol', async () => {
      await expectRevert(ColuLocalCurrency.new('MasterCoin', '', 18, MAX_TOKENS, 'metadatahash', {from: owner}))
    })

    it('should not construct without a totalSupply', async () => {
      await expectRevert(ColuLocalCurrency.new('MasterCoin', 'MC', 18, 0, 'metadatahash', {from: owner}))
    })

    it('should be able to construct currency with all args', async () => {
      const cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 18, MAX_TOKENS, 'metadatahash', {from: owner})
      assert.equal((await cc.name()), 'MasterCoin')
      assert.equal((await cc.symbol()), 'MC')
      assert.equal((await cc.decimals()), 18)
      assert.equal((await cc.totalSupply()), MAX_TOKENS)
      assert.equal((await cc.metadata()), 'metadatahash')
      assert.equal((await cc.owner()), owner)
    })

    it('should be able to construct currency without decimals', async () => {
      const cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 0, MAX_TOKENS, 'metadatahash', {from: owner})
      assert.equal((await cc.decimals()), 0)
    })

    it('should be able to construct currency without metadata', async () => {
      const cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 18, MAX_TOKENS, '', {from: owner})
      assert.equal((await cc.metadata()), '')
    })
  })

  describe('actions', () => {
    beforeEach(async () => {
      cc = await ColuLocalCurrency.new('MasterCoin', 'MC', 0, MAX_TOKENS, 'metadatahash', {from: owner})
    })

    describe('metadata', () => {
      it('owner should be able to update metadata', async () => {
        let result = await cc.setMetadata('newmetadatahash', {from: owner})
        assert.equal((await cc.metadata()), 'newmetadatahash')

        assert.equal(result.logs.length, 1)
        assert.equal(result.logs[0].event, 'MetadataChanged')
        assert.equal(result.logs[0].args.metadata, 'newmetadatahash')
      })

      it('owner should be able to update metadata', async () => {
        await expectRevert(cc.setMetadata('newmetadata', {from: notOwner}))
      })
    })
  })
})
