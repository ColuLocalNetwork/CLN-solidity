const expectRevert = require('./helpers/expectRevert');
const coder = require('web3-eth-abi');
const expect = require('chai').expect;
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });
const time = require('./helpers/time');

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');
const EllipseMarketMaker = artifacts.require('EllipseMarketMaker');
const IssuanceFactory = artifacts.require('IssuanceFactory');
const ColuLocalCurrency = artifacts.require('ColuLocalCurrency');
const EllipseMarketMakerLib =  artifacts.require('EllipseMarketMakerLib');

const TOKEN_DECIMALS = 10 ** 18;

const THOUSAND_CLN = 1000 * TOKEN_DECIMALS;

const CLN_MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS;
const CC_MAX_TOKENS = 15 * 10 ** 6 * TOKEN_DECIMALS;

const PARTICIPATE_ABI = {
    name: 'participate',
    type: 'function',
    inputs: [
        {
            type: 'address',
            name: 'token'
        }
    ]
}

const REFUND_ABI = {
    name: 'refund',
    type: 'function',
    inputs: [
        // {
        //     type: 'address',
        //     name: 'token'
        // }
    ]
}

const EXTRACT_FROM_MM_AND_TRANSFER_WITH_MIN_ABI = {
    name: 'extractCLNfromMarketMaker',
    type: 'function',
    inputs: []
}


const encodeData = (refund, token) => {
    let abi, params;
    if (!refund) {
        abi = PARTICIPATE_ABI;
        //console.log('encoding INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI')
        params = [token];
    } else {
        abi = REFUND_ABI;
        params = [];
    }
    return coder.encodeFunctionCall(abi, params);
};

contract('IssuanceFactory', (accounts) => {
    let cln;

    let Factory;
    let mmAdress;

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
       // await cln.transfer(accounts[2], THOUSAND_CLN * 1000);
       // await cln.transfer(accounts[3], THOUSAND_CLN * 1000);
    });


    describe ('Issue through CLN', async () => {
        beforeEach(async () => {
            Factory = await IssuanceFactory.new(mmlib.address,  cln.address,  {from: accounts[0]} )
        });

        it('should not be able to create without name', async () => {
            await expectRevert(Factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2,'', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });

        it('should not be able to create without symbol', async () => {
            await expectRevert(Factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', '', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });


        it('should not be able to create with zero decimals', async () => {
            await expectRevert(Factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 0, CC_MAX_TOKENS, {from: accounts[0]}));
        });


        it('should not be able to create with zero supply', async () => {
            await expectRevert(Factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, 0, {from: accounts[0]}));
        });

        it('should not be able to create with too small reserve', async () => {
            await expectRevert(Factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });

        it('should be able to create with correct parameters', async () => {
            now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;
            let result = await Factory.createIssuance(now + 10, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token
            assert(expect(tokenAddress).to.be.a('String'));
        });

    });

    describe('Participate in ICO through CLN', async () => {

        let now
        beforeEach(async () => {
            now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;
            Factory = await IssuanceFactory.new(mmlib.address, cln.address, {from: accounts[0]} );
            let clnAddress = await Factory.clnAddress();
            assert.equal(clnAddress ,cln.address);
            let result = await Factory.createIssuance(now + 10, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token
            assert(expect(tokenAddress).to.be.a('String'));
        });

        it('should not be able to participate with 0 cln', async () => {
            await expectRevert(Factory.participate(tokenAddress, 0, {from: accounts[1]}))
        });

        it('should not be able to participate with cln if no allowance was given', async () => {
            await expectRevert(Factory.participate(tokenAddress, THOUSAND_CLN, {from: accounts[0]}))
        });

        it('should not be able to participate cln if there is not tokens owner', async () => {
            cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            await expectRevert(Factory.participate['address,uint256'](accounts[2], THOUSAND_CLN, {from: accounts[1]}))
        });

        it('should not be able to participate with cln if sale has owner before starttime (approve, transfer)', async () => {
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            await expectRevert(Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[1]}))
        });

        it('should be able to participate with cln if sale has owner (approve, transfer)', async () => {
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress)
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
        });

        it('should be able to participate with cln if sale has owner (transferAndCall)', async () => {
            await time.increaseTime(10);
            let changeData = encodeData(false, tokenAddress);
            await cln.transferAndCall(Factory.address, THOUSAND_CLN, changeData, {from: accounts[1]});
            cc = await ColuLocalCurrency.at(tokenAddress)
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
        });

        it('should not be able to refund if not ended (approve, transfer)', async () => {
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
            await cc.approve(Factory.address, await cc.balanceOf(accounts[1]), {from: accounts[1]})
            await expectRevert(Factory.refund(accounts[0], await cc.balanceOf(accounts[1]), {from: accounts[1]}))
        });

        it('should not be able to refund if not under softcap (approve, transfer)', async () => {
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
             await time.increaseTime(10000000);
            await cc.approve(Factory.address, await cc.balanceOf(accounts[1]), {from: accounts[1]})
            await expectRevert(Factory.refund(tokenAddress, await cc.balanceOf(accounts[1]), {from: accounts[1]}))
        });

        it('should be able to refund if not ended and softcap not reached (approve, transfer)', async () => {
            clnvalue = await cln.balanceOf(accounts[1])
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN / 4, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
            await time.increaseTime(10000000);
            await cc.approve(Factory.address, await cc.balanceOf(accounts[1]), {from: accounts[1]})
            await Factory.refund(tokenAddress, await cc.balanceOf(accounts[1]), {from: accounts[1]})
            assert.equal(clnvalue.toNumber(), BigNumber(await cln.balanceOf(accounts[1])).toNumber())
        });

         it('should be able to refund if not ended and softcap not reached (transferAndCall)', async () => {
            clnvalue = await cln.balanceOf(accounts[1])
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN / 4, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
            await time.increaseTime(10000000);
            changeData = encodeData(true);
            await cc.transferAndCall(Factory.address, (await cc.balanceOf(accounts[1])), changeData, {from: accounts[1]});
            assert.equal(clnvalue.toNumber(), BigNumber(await cln.balanceOf(accounts[1])).toNumber())
        });

         it('should not be able to finalize if softcap not reached (approve, transfer)', async () => {
            clnvalue = await cln.balanceOf(accounts[1])
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN / 4, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
            await time.increaseTime(10000000);
            await expectRevert(Factory.finalize(tokenAddress, {from: accounts[0]}))
        });

         it('should not be able to finalize if endtime not reached (approve, transfer)', async () => {
            clnvalue = await cln.balanceOf(accounts[1])
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN / 2, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
            await time.increaseTime(100000);
            await expectRevert(Factory.finalize(tokenAddress, {from: accounts[0]}))
        });

        it('should be able to finalize if endtime reached and over softcap (raise cc only)', async () => {
            clnvalue = await cln.balanceOf(accounts[0])
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN / 2, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
            await time.increaseTime(10000000);
            ccvalue = await cc.balanceOf(accounts[0])
            await Factory.finalize(tokenAddress, {from: accounts[0]})
            assert.isAbove((await cc.balanceOf(accounts[0])).toNumber(), ccvalue.toNumber() )
        });


        it('should be able to finalize if endtime reached and over softcap (raise cc and cln)', async () => {
            clnvalue = await cln.balanceOf(accounts[0])
            await time.increaseTime(10);
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            assert( await Factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: accounts[1]}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(accounts[1])).toNumber(), 0);
            await time.increaseTime(10000000);
            ccvalue = await cc.balanceOf(accounts[0])
            await Factory.finalize(tokenAddress,{from: accounts[0]})
            assert.isAbove((await cc.balanceOf(accounts[0])).toNumber(), ccvalue.toNumber() )
            assert.isAbove((await cln.balanceOf(accounts[0])).toNumber(), clnvalue.toNumber() )
        });



    });

});
