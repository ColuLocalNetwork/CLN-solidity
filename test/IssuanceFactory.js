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
    let cc;

    before(async () => {
        mmLib = await EllipseMarketMakerLib.new();
    });

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        await cln.makeTokensTransferable();
        await cln.transfer(notOwner, THOUSAND_CLN * 1000);
        // await cln.transfer(accounts[2], THOUSAND_CLN * 1000);
        // await cln.transfer(accounts[3], THOUSAND_CLN * 1000);
    });

    describe('Constructor.', async () => {

        it('should not construct without market making lib address', async () => {
            await expectRevert(IssuanceFactory.new(null, cln.address,  {from: owner} ));
        });

        it('should not construct with no address to CLN contract', async () => {
            await expectRevert(IssuanceFactory.new(mmLib.address, null,  {from: owner} ));
        });

        it('should construct with correct pramms', async () => {
            await cln.makeTokensTransferable();
            factory = await IssuanceFactory.new(mmLib.address, cln.address,  {from: owner} )
            assert.equal((await factory.clnAddress()) ,cln.address);
            assert.equal((await factory.mmLibAddress()) ,mmLib.address);
            assert.equal((await factory.CLNTotalSupply()), CLN_MAX_TOKENS);
            assert.equal((await factory.precision()), TOKEN_DECIMALS);
        });
    });

    describe ('Issue through CLN', async () => {
        beforeEach(async () => {
            factory = await IssuanceFactory.new(mmLib.address,  cln.address,  {from: owner} )
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

            // Validating Issuance Struct initialization
            const issuanceStruct = await factory.issueMap(tokenAddress);
            // hardcap
            assert(issuanceStruct[0].eq(THOUSAND_CLN))
            // reserve
            assert(issuanceStruct[1].eq(THOUSAND_CLN / 2))
            // start time
            assert(issuanceStruct[2].eq(now + 10))
            // end time
            assert(issuanceStruct[3].eq(now + 10 + 1000000))
            // target price (real target price is price / precision)
            assert.equal(issuanceStruct[4].toNumber(), 12247445652053500000)
            // CLN raised
            assert(issuanceStruct[5].eq(0))
        });

    });

    describe('Local Currency issuance.', async () => {

        let now
        beforeEach(async () => {
            now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;
            factory = await IssuanceFactory.new(mmLib.address, cln.address, {from: owner} );
            let clnAddress = await factory.clnAddress();
            assert.equal(clnAddress ,cln.address);
            let result = await factory.createIssuance(now + 10, 1000000, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token
            assert(expect(tokenAddress).to.be.a('String'));
            cc = await ColuLocalCurrency.at(tokenAddress)
        });


        describe('Participate in the CC issuance.', async () => {
            it('should not be able to participate with 0 CLN', async () => {
                await expectRevert(factory.participate(tokenAddress, 0, {from: notOwner}));
            });

            it('should not be able to participate before sale is open (for currency owner)', async () => {
                cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it('should not be able to participate before sale is open (for currency not owner)', async () => {
                await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner});
                await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}));
            });

            it('should not be able to participate with bad token address', async () => {
                cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
                await expectRevert(factory.participate['address,uint256']('0', THOUSAND_CLN, {from: owner}));
                // using mmLib address instead of token address
                await expectRevert(factory.participate['address,uint256'](mmLib.address, THOUSAND_CLN, {from: owner}));
            });

            it('should not be able to participate with CLN if no allowance was given', async () => {
                // open the sale
                await time.increaseTime(10);
                await expectRevert(factory.participate(tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it.only('should be able to participate with CLN as owner if sale is open (approve, transfer)', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                const result = await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner});

                // validating CLNRaised event
                // assert.lengthOf(result.logs, 1);
                // let event = result.logs[0];
                // assert.equal(event.event, 'CLNRaised');
                // assert.equal(event.args.token, tokenAddress);
                // assert.equal(event.args.participant, owner);
                // assert(event.args.amount.eq(THOUSAND_CLN));

                const ccBalance = await cc.balanceOf(owner);
                assert.notEqual(ccBalance.toNumber(), 0);
                assert.equal(ccBalance.div(10 ** 8).toNumber(), 122474456520535);
                assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN));
            });

            it('should be able to participate with CLN as not owner if sale is open (approve, transfer)', async () => {
                await time.increaseTime(100);
                await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
                const releaseAmount = await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner});
                ccBalance = BigNumber(await cc.balanceOf(notOwner));
                assert(releaseAmount.eq(ccBalance));
                assert.notEqual(ccBalance.toNumber(), 0);
                // assert.equal(ccBalance.toNumber(), 10);
            });

            it('should not be able to participate if the hardcap reached', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner});
                await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it('should be able to participate until hardcap is reached', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: owner});
                let ccBalance = await cc.balanceOf(owner);
                assert.notEqual(ccBalance.toNumber(), 0);
                assert.equal(ccBalance.div(10 ** 8).toNumber(), 61237228260267.5);
                assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN / 2));

                const event = (await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner})).logs[0];
                assert.equal(event.event, 'CLNRaised');
                assert.equal(event.args.participant, owner);
                // hardcap reached so only another 500 CLN raised
                assert(event.args.amount.eq(THOUSAND_CLN / 2));

                ccBalance = await cc.balanceOf(owner);
                assert.equal(ccBalance.div(10 ** 8).toNumber(), 122474456520535);
                assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN));

                // sale closed
                await expectRevert(factory.participate['address,uint256'](tokenAddress, 1, {from: owner}));
            });

            it('should not be able to participate when the sale closed', async () => {
                await time.increaseTime(1000010);
                await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
                await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it('should be able to participate with CLN if sale has owner (transferAndCall)', async () => {
                await time.increaseTime(10);
                let changeData = encodeData(false, tokenAddress);
                await cln.transferAndCall(factory.address, THOUSAND_CLN, changeData, {from: notOwner});
                cc = await ColuLocalCurrency.at(tokenAddress)
                assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            });
        })


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
            await expectRevert(factory.finalize(tokenAddress, {from: owner}));
        });

        it('should be able to finalize if endtime reached and over softcap (raise CC only)', async () => {
            clnvalue = await cln.balanceOf(owner);
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN / 2, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(10000000);
            ccvalue = await cc.balanceOf(owner);
            await factory.finalize(tokenAddress, {from: owner});
            assert.isAbove((await cc.balanceOf(owner)).toNumber(), ccvalue.toNumber());
        });


        it('should be able to finalize if endtime reached and over softcap (raise CC and CLN)', async () => {
            clnvalue = await cln.balanceOf(owner);
            await time.increaseTime(10);
            await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner})
            assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}))
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(notOwner)).toNumber(), 0);
            await time.increaseTime(10000000);
            ccvalue = await cc.balanceOf(owner);
            await factory.finalize(tokenAddress,{from: owner})
            assert.isAbove((await cc.balanceOf(owner)).toNumber(), ccvalue.toNumber() )
            assert.isAbove((await cln.balanceOf(owner)).toNumber(), clnvalue.toNumber() )
        });
    });
});
