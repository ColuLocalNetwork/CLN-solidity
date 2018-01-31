const expectRevert = require('./helpers/expectRevert');
const coder = require('web3-eth-abi');
const expect = require('chai').expect;
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');
const EllipseMarketMaker = artifacts.require('EllipseMarketMaker');
const CurrencyFactory = artifacts.require('CurrencyFactory');
const ColuLocalCurrency = artifacts.require('ColuLocalCurrency');
const EllipseMarketMakerLib =  artifacts.require('EllipseMarketMakerLib');

const TOKEN_DECIMALS = 10 ** 18;

const THOUSAND_CLN = 1000 * TOKEN_DECIMALS;

const CLN_MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS;
const CC_MAX_TOKENS = 15 * 10 ** 6 * TOKEN_DECIMALS;

const STRUCT_SIZE = 5;

const INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI = {
    name: 'insertCLNtoMarketMaker',
    type: 'function',
    inputs: [{
        type: 'address',
        name: 'token'
    }],
    outputs: [
        {
            type: 'bool',
            name: 'success'
        }
    ]
}

const EXTRACT_FROM_MM_AND_TRANSFER_WITH_MIN_ABI = {
    name: 'extractCLNfromMarketMaker',
    type: 'function',
    inputs: []
}

const encodeData = (toToken) => {
    let abi, params;
    if (toToken) {
        abi = INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI;
        //console.log('encoding INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI')
        params = [toToken];
    } else {
        abi = EXTRACT_FROM_MM_AND_TRANSFER_WITH_MIN_ABI;
        //params = [toToken];
    }
    return coder.encodeFunctionCall(abi, params);
};

contract('CurrencyFactory', (accounts) => {
    let cln;

    let Factory;
    let mmAdress;
    let mmlib;

    let owner = accounts[0];
    let nonOwner = accounts[1];

    let amount = 50 * TOKEN_DECIMALS;
    let tokenAddress;
    
    before(async () => {
        mmlib = await EllipseMarketMakerLib.new();
    });

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        await cln.makeTokensTransferable();
        await cln.transfer(accounts[1], THOUSAND_CLN * 1000);
    });

    describe('construction', async () => {
        it('should not construct with no address to cln contract', async () => {
            await expectRevert(CurrencyFactory.new(mmlib.address, null,  {from: accounts[0]} ));
        });

        it('should construct with correct pramms', async () => {
            await cln.makeTokensTransferable();
            Factory = await CurrencyFactory.new(mmlib.address, cln.address,  {from: accounts[0]} )
            assert.equal((await Factory.clnAddress()) ,cln.address);
         });
    });

    describe('creating a MarketMaker', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            Factory = await CurrencyFactory.new(mmlib.address, cln.address,  {from: accounts[0]} )
        });

        it('should not be able to create without name', async () => {
            await expectRevert(Factory.createCurrency('', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });

        it('should not be able to create without symbol', async () => {
            await expectRevert(Factory.createCurrency('Some Name', '', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });

        it('should not be able to create with zero decimals', async () => {
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 0, CC_MAX_TOKENS, {from: accounts[0]}));
        });

        it('should not be able to create with zero supply', async () => {
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 18, 0, {from: accounts[0]}));
        });

        it('should be able to create with correct parameters', async () => {
            let result = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
        });
    });

    describe('Interact with MarketMaker through factory before opening market', async () => {

        beforeEach(async () => {           
            Factory = await CurrencyFactory.new(mmlib.address, cln.address,  {from: accounts[0]} )
            assert.equal(await Factory.clnAddress() ,cln.address);
            let result = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token
            assert(expect(tokenAddress).to.be.a('String'));
        });

        it('should not be able to insert 0 cln', async () => {
            await expectRevert(Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, 0, {from: accounts[0]}))
        });

        it('should not be able to insert cln if no allowance was given', async () => {
            await expectRevert(Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[0]}))
        });

        it('should not be able to insert cln if not owner', async () => {
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            await expectRevert(Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[1]}))
        });

        it('should be able to insert cln if owner (approve, transfer)', async () => {
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[0]})
            assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[0]}))
            let ccadder = await Factory.currencyMap(tokenAddress);
            cc = await ColuLocalCurrency.at(tokenAddress)
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[0])).toNumber(), 0);
        });

        it('should be able to insert cc if owner and get back cln', async () => {
            let clnvalue = BigNumber(await cln.balanceOf(accounts[0]));
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[0]})
            // assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[0]}))
            await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[0]})
            let ccadder = await Factory.currencyMap(tokenAddress);
            cc = await ColuLocalCurrency.at(tokenAddress)
            mm = await EllipseMarketMaker.at(ccadder[STRUCT_SIZE -1])
            let ccvalue = BigNumber(await cc.balanceOf(accounts[0]));
            assert.notEqual(ccvalue.toNumber(), 0);
            await cc.approve(Factory.address, ccvalue, {from: accounts[0]})
            assert(await Factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, ccvalue, {from: accounts[0]}))
            let newclnValue = BigNumber(await cln.balanceOf(accounts[0]))
            assert.equal(newclnValue.toNumber(), clnvalue.toNumber())
        });

        it('should not be able to insert cc if not owner and get back cln', async () => {
            let clnvalue = BigNumber(await cln.balanceOf(accounts[0]));
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[0]})
            assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[0]}))
            let ccadder = await Factory.currencyMap(tokenAddress);
            cc = await ColuLocalCurrency.at(tokenAddress)
            mm = await EllipseMarketMaker.at(ccadder[STRUCT_SIZE -1])
            let ccvalue = BigNumber(await cc.balanceOf(accounts[0]));
            assert.notEqual(ccvalue, 0);
            await cc.transfer(accounts[1], ccvalue, {from: accounts[0]})
            await cc.approve(Factory.address, ccvalue, {from: accounts[1]})
            await expectRevert(Factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, ccvalue, {from: accounts[1]}))
            assert.equal(ccvalue.toNumber(), (await cc.balanceOf(accounts[1])).toNumber());
        });

        it('should be able to insert cln if owner (callAndTransfer)', async () => {
            let changeData = encodeData(tokenAddress);
            await cln.transferAndCall(Factory.address, THOUSAND_CLN, changeData);
            cc = await ColuLocalCurrency.at(tokenAddress)
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[0])).toNumber(), 0);
        });

        it('should not be able to open market if not owner', async () => {
            await expectRevert(Factory.openMarket(tokenAddress, {from: accounts[1]}))
        })

        it('should be able to open market if owner', async () => {
            await Factory.openMarket(tokenAddress, {from: accounts[0]})
        })
    });
});