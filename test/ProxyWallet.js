const BigNumber = require('bignumber.js')

const expectRevert = require('./helpers/expectRevert')

const BasicTokenMock = artifacts.require('BasicTokenMock')
const ProxyWallet = artifacts.require('ProxyWallet')

const DEFAULT_GAS_PRICE = 100000000000

contract('ProxyWallet', (accounts) => {
  let token
  let proxy

  let initialFunds = 10000 // Initial owner funds
  let transferredFunds = 1200 // Funds to be transferred around in tests
  let allowedAmount = 100 // Spender allowance

  let owner = accounts[0]
  let proxyOwner = '0xAde4785c5B5699E25B1E345d708be6295CDce938'
  // let to = accounts[2]

  // These need to be reset before every test
  // in a beforeEach() clause
  let balanceOwner
  let balanceProxyOwner
  let balanceProxy
  let balanceTo

  let value = new BigNumber('1e18')
  let delegationSig = "0x44725ce78e46c6569fd64c98da53195ba395f7994dfc1ae826796aecef503e4673e4acc3e797295d88d1f50071d0900207ed3f2d6c9cf9b6cb97edf638a111f01c"
  let to = "0xDF6640dB4E24EE7dca8cc0d6939121567d3E2609"
  let sendValue = new BigNumber("5e17")
  let data = "0x"
  let nonce = 0

  beforeEach(async () => {
    // token = await BasicTokenMock.new()
    proxy = await ProxyWallet.new(proxyOwner)

    // Should return 0 balance for owner account
    // assert.equal((await token.balanceOf(owner)).toNumber(), 0)

    // Assign tokens to account[0] ('owner')
    // await token.assign(proxy.address, initialFunds)

    balanceOwner = await web3.eth.getBalance(owner)
    balanceProxy = await web3.eth.getBalance(proxy.address)
    assert.equal(balanceProxy, 0)

    let transaction = await proxy.sendTransaction({from: owner, value: value})
    let gasUsed = DEFAULT_GAS_PRICE * transaction.receipt.gasUsed

    let balanceOwner2 = await web3.eth.getBalance(owner)
    assert.equal(balanceOwner2.toNumber(), balanceOwner.minus(value).minus(gasUsed).toNumber())

    let balanceProxy2 = await web3.eth.getBalance(proxy.address)
    assert.equal(balanceProxy2.toNumber(), balanceProxy.plus(value).toNumber())

    balanceOwner = balanceOwner2
    balanceProxy = balanceProxy2
    balanceProxyOwner = await web3.eth.getBalance(proxyOwner)
    balanceTo = await web3.eth.getBalance(to)
  })

  describe('Ether transfer', async () => {
    it('should update ether balnace after send', async () => {
      let balanceProxyOld = balanceProxy
      await proxy.proxyTx(delegationSig, to, sendValue, data, nonce)
      balanceProxy = await web3.eth.getBalance(proxy.address)
      assert.equal(balanceProxy.toNumber(), balanceProxyOld.minus(sendValue).toNumber())
      balanceProxyOld = balanceProxy
      await expectRevert(proxy.proxyTx(delegationSig, to, sendValue, data, nonce))
      balanceProxy = await web3.eth.getBalance(proxy.address)
      assert.equal(balanceProxy.toNumber(), balanceProxyOld.toNumber())
    })
  })
})
