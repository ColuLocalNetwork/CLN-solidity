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

    let factory;
    let mmAdress;

    let owner = accounts[0];
    let notOwner = accounts[1];

    let amount = 50 * TOKEN_DECIMALS;
    let tokenAddress;

    before(async () => {
        mmlib = await EllipseMarketMakerLib.new();
    });

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        await cln.makeTokensTransferable();
        await cln.transfer(notOwner, THOUSAND_CLN * 1000);
       // await cln.transfer(accounts[2], THOUSAND_CLN * 1000);
       // await cln.transfer(accounts[3], THOUSAND_CLN * 1000);
    });


    describe ('Issue through CLN', async () => {
        beforeEach(async () => {
            factory = await IssuanceFactory.new(mmlib.address,  cln.address,  {from: owner} )
        });

        it('should not be able to create without name', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2,'', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create without symbol', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', '', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with zero decimals', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 0, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with zero supply', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, 0, {from: owner}));
        });

        it('should not be able to create with too small reserve', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with start time in past', async () => {
            await expectRevert(factory.createIssuance(Date.now() - 100, 1000000, THOUSAND_CLN, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with hardcap zero', async () => {
            await expectRevert(factory.createIssuance(Date.now() - 100, 1000000, 0, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with duration zero', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, 0, THOUSAND_CLN, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should be able to create with correct parameters', async () => {
            now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;
            let result = await factory.createIssuance(now + 10, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token
            assert(expect(tokenAddress).to.be.a('String'));
        });

    });

    describe('Local Currency issuance', async () => {

        let now
        beforeEach(async () => {
            now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;
            factory = await IssuanceFactory.new(mmlib.address, cln.address, {from: owner} );
            let clnAddress = await factory.clnAddress();
            assert.equal(clnAddress ,cln.address);
            let result = await factory.createIssuance(now + 10, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token
            assert(expect(tokenAddress).to.be.a('String'));
        });


        describe('Participate in the CC issuance', async () => {
          it('should not be able to participate with 0 CLN', async () => {
              await expectRevert(factory.participate(tokenAddress, 0, {from: notOwner}));
          });

          it('should not be able to participate with CLN if no allowance was given', async () => {
              await expectRevert(factory.participate(tokenAddress, THOUSAND_CLN, {from: owner}));
          });

          it.only('should not be able to participate CLN if there is not tokens owner', async () => {
              cln.approve(factory.address, THOUSAND_CLN, {from: notOwner});
              await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}));
              assert(false);
          });

          it('should not be able to participate with CLN if sale has owner before starttime (approve, transfer)', async () => {
              await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner});
              await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}));
          });

          it('should not be able to participate with bad token address', async () => {
              cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
              await expectRevert(factory.participate['address,uint256']('0', THOUSAND_CLN, {from: owner}));
              // using mmlib address instead of token address
              await expectRevert(factory.participate['address,uint256'](mmlib.address, THOUSAND_CLN, {from: owner}));
          });

          it('should be able to participate with CLN if sale has owner (approve, transfer)', async () => {
              await time.increaseTime(10);
              await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
              assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}))
              cc = await ColuLocalCurrency.at(tokenAddress)
              assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
          });
        })


        it('should be able to participate with CLN if sale has owner (transferAndCall)', async () => {
            await time.increaseTime(10);
            let changeData = encodeData(false, tokenAddress);
            await cln.transferAndCall(factory.address, THOUSAND_CLN, changeData, {from: notOwner});
            cc = await ColuLocalCurrency.at(tokenAddress)
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
        });

        it('should not be able to refund if not ended (approve, transfer)', async () => {
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await cc.approve(factory.address, await cc.balanceOf(notOwner), {from: notOwner})
            await expectRevert(factory.refund(owner, await cc.balanceOf(notOwner), {from: notOwner}))
        });

        it('should not be able to refund if not under softcap (approve, transfer)', async () => {
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
             await time.increaseTime(10000000);
            await cc.approve(factory.address, await cc.balanceOf(notOwner), {from: notOwner})
            await expectRevert(factory.refund(tokenAddress, await cc.balanceOf(notOwner), {from: notOwner}))
        });

        it('should be able to refund if not ended and softcap not reached (approve, transfer)', async () => {
            clnvalue = await cln.balanceOf(notOwner)
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN / 4, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(10000000);
            await cc.approve(factory.address, await cc.balanceOf(notOwner), {from: notOwner})
            await factory.refund(tokenAddress, await cc.balanceOf(notOwner), {from: notOwner})
            assert.equal(clnvalue.toNumber(), BigNumber(await cln.balanceOf(notOwner)).toNumber())
        });

         it('should be able to refund if not ended and softcap not reached (transferAndCall)', async () => {
            clnvalue = await cln.balanceOf(notOwner)
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN / 4, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(10000000);
            changeData = encodeData(true);
            await cc.transferAndCall(factory.address, (await cc.balanceOf(notOwner)), changeData, {from: notOwner});
            assert.equal(clnvalue.toNumber(), BigNumber(await cln.balanceOf(notOwner)).toNumber())
        });

         it('should not be able to finalize if softcap not reached (approve, transfer)', async () => {
            clnvalue = await cln.balanceOf(notOwner)
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN / 4, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(10000000);
            await expectRevert(factory.finalize(tokenAddress, {from: owner}))
        });

         it('should not be able to finalize if endtime not reached (approve, transfer)', async () => {
            clnvalue = await cln.balanceOf(notOwner)
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN / 2, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(100000);
            await expectRevert(factory.finalize(tokenAddress, {from: owner}))
        });

        it('should be able to finalize if endtime reached and over softcap (raise CC only)', async () => {
            clnvalue = await cln.balanceOf(owner)
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN / 2, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(10000000);
            ccvalue = await cc.balanceOf(owner)
            await factory.finalize(tokenAddress, {from: owner})
            assert.isAbove((await cc.balanceOf(owner)).toNumber(), ccvalue.toNumber() )
        });


        it('should be able to finalize if endtime reached and over softcap (raise CC and CLN)', async () => {
            clnvalue = await cln.balanceOf(owner)
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(10000000);
            ccvalue = await cc.balanceOf(owner)
            await factory.finalize(tokenAddress,{from: owner})
            assert.isAbove((await cc.balanceOf(owner)).toNumber(), ccvalue.toNumber() )
            assert.isAbove((await cln.balanceOf(owner)).toNumber(), clnvalue.toNumber() )
        });
    });

});
