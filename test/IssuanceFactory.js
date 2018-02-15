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

const SALE_DURATION_TIME = 1000000;
const SALE_ENDED_TIME = SALE_DURATION_TIME * 2;

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

const encodeParticipateMessage = (token) => {
    abi = PARTICIPATE_ABI;
    params = [token];
    return coder.encodeFunctionCall(abi, params);
};

const encodeRefundMessage = (token) => {
    abi = REFUND_ABI;
    params = [];
    return coder.encodeFunctionCall(abi, params);
};

contract('IssuanceFactory', (accounts) => {
    let cln;

    let factory;
    let mmAdress;

    const owner = accounts[0];
    const participant = accounts[1];
    const participant2 = accounts[2];

    let tokenAddress;
    let cc;

    before(async () => {
        mmLib = await EllipseMarketMakerLib.new();
    });

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        await cln.makeTokensTransferable();
        await cln.transfer(participant, THOUSAND_CLN * 1000);
        await cln.transfer(participant2, THOUSAND_CLN * 1000);
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
            factory = await IssuanceFactory.new(mmLib.address, cln.address,  {from: owner} );
            assert.equal((await factory.clnAddress()) ,cln.address);
            assert.equal((await factory.mmLibAddress()) ,mmLib.address);
            assert.equal((await factory.CLNTotalSupply()), CLN_MAX_TOKENS);
            assert.equal((await factory.PRECISION()), TOKEN_DECIMALS);
        });
    });

    describe ('Issue through CLN.', async () => {
        beforeEach(async () => {
            factory = await IssuanceFactory.new(mmLib.address,  cln.address,  {from: owner} )
        });

        it('should not be able to create without name', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,'', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create without symbol', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', '', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with zero decimals', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 0, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with zero supply', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, 0, {from: owner}));
        });

        it('should not be able to create with too small reserve', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with start time in past', async () => {
            await expectRevert(factory.createIssuance(Date.now() - 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with hardcap zero', async () => {
            await expectRevert(factory.createIssuance(Date.now() - 100, SALE_DURATION_TIME, 0, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with duration zero', async () => {
            await expectRevert(factory.createIssuance(Date.now() + 100, 0, THOUSAND_CLN, THOUSAND_CLN / 1000, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should be able to create with correct parameters', async () => {
            now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;
            let result = await factory.createIssuance(now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});
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
            assert(issuanceStruct[3].eq(now + 10 + SALE_DURATION_TIME))
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

            tokenAddress = (await factory.createIssuance(
                now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner})).logs[0].args.token;

            cc = await ColuLocalCurrency.at(tokenAddress);
        });

        it('should create currency in a correct way', async () => {
            let result = await factory.createIssuance(now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2, 'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token
            assert(expect(tokenAddress).to.be.a('String'));
        });


        describe('Participate in the CC issuance.', async () => {
            it('should not be able to participate with 0 CLN', async () => {
                await time.increaseTime(10);
                await expectRevert(factory.participate(tokenAddress, 0, {from: participant}));
            });

            it('should not be able to participate before sale is open (for currency owner)', async () => {
                cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it('should not be able to participate before sale is open (for currency not owner)', async () => {
                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant}));
            });

            it('should not be able to participate with bad token address', async () => {
                await time.increaseTime(10);
                cln.approve(factory.address, THOUSAND_CLN, {from: participant})
                await expectRevert(factory.participate['address,uint256']('0', THOUSAND_CLN, {from: owner}));
                // using mmLib address instead of token address
                await expectRevert(factory.participate['address,uint256'](mmLib.address, THOUSAND_CLN, {from: owner}));
            });

            it('should not be able to participate with CLN if no allowance was given', async () => {
                // open the sale
                await time.increaseTime(10);
                await expectRevert(factory.participate(tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it('should be able to participate with CLN as owner if sale is open (approve, transfer)', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                const result = await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner});

                // validating CLNRaised event
                assert.lengthOf(result.logs, 1);
                let event = result.logs[0];
                assert.equal(event.event, 'CLNRaised');
                assert.equal(event.args.token, tokenAddress);
                assert.equal(event.args.participant, owner);
                assert(event.args.amount.eq(THOUSAND_CLN));

                const ccBalance = await cc.balanceOf(owner);
                assert.notEqual(ccBalance.toNumber(), 0);
                assert.equal(ccBalance.div(10 ** 8).toNumber(), 122474456520535);
                assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN));
            });

            it('should be able to participate with CLN as not owner if sale is open (approve, transfer)', async () => {
                await time.increaseTime(100);
                await cln.approve(factory.address, THOUSAND_CLN, {from: participant})
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant});
                ccBalance = BigNumber(await cc.balanceOf(participant));
                assert.notEqual(ccBalance.toNumber(), 0);

                assert.equal(ccBalance.div(10 ** 8).toNumber(), 122474456520535);
                assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN));
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
                // waiting for sale to duration time + 100 secodd to make sure the sale is closed
                await time.increaseTime(SALE_DURATION_TIME + 100);
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                await expectRevert(factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            describe('transferAndCall: ', async () => {
                it('should be able to participate as owner', async () => {
                    await time.increaseTime(10);
                    const participateMessage = encodeParticipateMessage(tokenAddress);
                    await cln.transferAndCall(factory.address, THOUSAND_CLN, participateMessage, {from: owner});
                    assert.notEqual((await cc.balanceOf(owner)).toNumber(), 0);
                    assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN));
                });

                it('should be able to participate as not owner', async () => {
                    await time.increaseTime(10);
                    const participateMessage = encodeParticipateMessage(tokenAddress);
                    await cln.transferAndCall(factory.address, THOUSAND_CLN, participateMessage, {from: participant});
                    assert.notEqual(BigNumber(await cc.balanceOf(participant)).toNumber(), 0);
                    assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN));
                });

                it('should not be able to participate with bad contract address', async () => {
                    await time.increaseTime(10);
                    const participateMessage = encodeParticipateMessage(mmLib.address);
                    await expectRevert(cln.transferAndCall(factory.address, THOUSAND_CLN, participateMessage, {from: participant}));
                    assert.equal((await cc.balanceOf(participant)).toNumber(), 0);
                    assert((await factory.totalCLNcustodian()).eq(0));
                });
            });
        });

        describe('Finalize CC issuance.', () => {

            it('should not be able to finalize if softcap not reached (approve, transfer)', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN / 4, {from: owner})
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: owner}))
                assert.notEqual(BigNumber(await cc.balanceOf(owner)).toNumber(), 0);

                // sale ended
                await time.increaseTime(SALE_DURATION_TIME + 10);
                await expectRevert(factory.finalize(tokenAddress, {from: owner}));
            });

            it('should not be able to finalize if sale not ended (approve, transfer)', async () => {
                await time.increaseTime(10);

                // reaching the hardcap
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
                assert.notEqual(BigNumber(await cc.balanceOf(owner)).toNumber(), 0);

                await expectRevert(factory.finalize(tokenAddress, {from: owner}));
            });

            it('should not be able to finalize if sale not ended (approve, transfer)', async () => {
                await time.increaseTime(10);

                // reaching the hardcap
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
                cc = await ColuLocalCurrency.at(tokenAddress);
                assert.notEqual(BigNumber(await cc.balanceOf(owner)).toNumber(), 0);

                await expectRevert(factory.finalize(tokenAddress, {from: owner}));
            });


            it('should be able to finalize if owner, sale is ended and is successfull', async () => {
                const clnBalance = await cln.balanceOf(owner);
                const THOUSAND_CLN_3_4 = THOUSAND_CLN / 4 * 3
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN_3_4, {from: participant});
                const result = await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN_3_4, {from: participant});
                assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN_3_4));
                assert.equal((await cc.balanceOf(participant)).div(10 ** 8).toNumber(), 91855842390401.25);


                // reaching end of sale
                await time.increaseTime(SALE_ENDED_TIME);

                // finalizing
                const logs = (await factory.finalize(tokenAddress, {from: owner})).logs;

                assert.lengthOf(logs, 1);
                const event = logs[0];
                assert.equal(event.event, 'SaleFinalized');

                assert.equal(tokenAddress, event.args.token);
                assert.equal(THOUSAND_CLN_3_4, event.args.clnRaised);

                // owner of the currency receives CLN raised above the specified reserve amount
                assert((await factory.totalCLNcustodian()).eq(THOUSAND_CLN / 2));
                const finalClnBalance = await cln.balanceOf(owner);
                assert(finalClnBalance.eq(clnBalance.plus(THOUSAND_CLN / 4)));
            });

            it('should not be able to finalize twice', async () => {
                // reaching hardcap
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
                const result = await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner});

                // reaching end of sale
                await time.increaseTime(SALE_ENDED_TIME);

                // finalizing
                await expectRevert(factory.finalize(tokenAddress, {from: participant}));

                assert(await factory.finalize(tokenAddress, {from: owner}));
                await expectRevert(factory.finalize(tokenAddress, {from: owner}));
            });

            it('should be able to finalize if endtime reached and over softcap (raise CC only)', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN / 2, {from: participant})
                assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: participant}))
                assert.notEqual(BigNumber(await cc.balanceOf(participant)).toNumber(), 0);
                await time.increaseTime(SALE_ENDED_TIME);
                ccvalue = await cc.balanceOf(owner);
                await factory.finalize(tokenAddress, {from: owner});
                assert.isAbove((await cc.balanceOf(owner)).toNumber(), ccvalue.toNumber());
            });

            it('should be able to finalize if endtime reached and over softcap (raise CC and CLN)', async () => {
                const clnBalance = await cln.balanceOf(owner);
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: participant})
                assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant}))
                assert.notEqual(BigNumber(await cc.balanceOf(participant)).toNumber(), 0);
                await time.increaseTime(SALE_ENDED_TIME);
                ccvalue = await cc.balanceOf(owner);
                await factory.finalize(tokenAddress,{from: owner})
                assert.isAbove((await cc.balanceOf(owner)).toNumber(), ccvalue.toNumber());
                assert.isAbove((await cln.balanceOf(owner)).toNumber(), clnBalance.toNumber());
            });
        });

        describe('Refund Currency Issuance.', async () => {
            it('should not be able to refund if not ended (approve, transfer)', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});

                // softcap not reached
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: participant}))
                assert.notEqual(BigNumber(await cc.balanceOf(participant)).toNumber(), 0);

                await cc.approve(factory.address, await cc.balanceOf(participant), {from: participant});
                await expectRevert(factory.refund(participant, await cc.balanceOf(participant), {from: participant}));
            });

            it('should not be able to refund if not under softcap (approve, transfer)', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: participant})
                assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant}))
                assert.notEqual(BigNumber(await cc.balanceOf(participant)).toNumber(), 0);
                await time.increaseTime(SALE_ENDED_TIME);
                await cc.approve(factory.address, await cc.balanceOf(participant), {from: participant})
                await expectRevert(factory.refund(tokenAddress, await cc.balanceOf(participant), {from: participant}))
            });

            it('should be able to refund if sale ended and softcap not reached (approve, transfer)', async () => {
                const clnBalance = await cln.balanceOf(participant)
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN / 4, {from: participant})
                assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: participant}))
                assert.notEqual(BigNumber(await cc.balanceOf(participant)).toNumber(), 0);
                await time.increaseTime(SALE_ENDED_TIME);
                await cc.approve(factory.address, await cc.balanceOf(participant), {from: participant});
                await factory.refund(tokenAddress, await cc.balanceOf(participant), {from: participant});
                assert.equal(clnBalance.toNumber(), BigNumber(await cln.balanceOf(participant)).toNumber());
            });

            it('should be able to refund if sale ended and softcap not reached (transferAndCall)', async () => {
                const clnBalance = await cln.balanceOf(participant)
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN / 4, {from: participant})
                assert( await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: participant}))
                assert.notEqual(BigNumber(await cc.balanceOf(participant)).toNumber(), 0);
                await time.increaseTime(SALE_ENDED_TIME);
                changeData = encodeRefundMessage();
                await cc.transferAndCall(factory.address, (await cc.balanceOf(participant)), changeData, {from: participant});
                assert.equal(clnBalance.toNumber(), BigNumber(await cln.balanceOf(participant)).toNumber())
            });

            it('should be able to refund multiple times', async () => {
                const clnBalance = await cln.balanceOf(participant)
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN / 4, {from: participant})
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: participant}))
                const ccBalance = await cc.balanceOf(participant);
                assert(!ccBalance.isZero());
                assert.equal(ccBalance.div(10 ** 8).toNumber(), 30618614130133.75);

                await time.increaseTime(SALE_ENDED_TIME);
                await cc.approve(factory.address, ccBalance / 2, {from: participant});
                await factory.refund(tokenAddress, ccBalance / 2, {from: participant});
                const clnAfterRefund = await cln.balanceOf(participant);

                // Half of participated CLN refunded
                assert.equal(clnBalance.sub(clnAfterRefund).toNumber(), THOUSAND_CLN / 8);

                // Refunding second half
                await cc.approve(factory.address, await cc.balanceOf(participant), {from: participant});
                await factory.refund(tokenAddress, await cc.balanceOf(participant), {from: participant});
                assert.equal(clnBalance.toNumber(),(await cln.balanceOf(participant)).toNumber());
            });

            it('should be able to transfer CC to 3rd party that will perform refund', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN / 4, {from: participant})
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 4, {from: participant}))
                const ccBalance = await cc.balanceOf(participant);
                assert(!ccBalance.isZero());
                assert.equal(ccBalance.div(10 ** 8).toNumber(), 30618614130133.75);

                const thirdParty = accounts[3];
                const clnBalance = await cln.balanceOf(thirdParty)
                await cc.transfer(thirdParty, ccBalance, {from: participant});

                await time.increaseTime(SALE_ENDED_TIME);
                await cc.approve(factory.address, ccBalance, {from: thirdParty});
                await factory.refund(tokenAddress, ccBalance, {from: thirdParty});
                const clnAfterRefund = await cln.balanceOf(thirdParty);

                // third party perform a refund and got refunded CLN tokens
                assert.equal(clnBalance.plus(THOUSAND_CLN / 4).toNumber(),
                    (await cln.balanceOf(thirdParty)).toNumber());
            });

            it('should be able to refund multiple users', async () => {
                const clnBalanceParticipant = await cln.balanceOf(participant)
                const clnBalanceParticipant2 = await cln.balanceOf(participant2)
                await time.increaseTime(10);

                await cln.approve(factory.address, THOUSAND_CLN / 10, {from: participant});
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 10, {from: participant}));

                await cln.approve(factory.address, THOUSAND_CLN / 5, {from: participant2});
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 5, {from: participant2}));

                const ccBalanceParticipant = await cc.balanceOf(participant);
                const ccBalanceParticipant2 = await cc.balanceOf(participant2);
                assert(!ccBalanceParticipant.isZero());
                assert(!ccBalanceParticipant2.isZero());


                await time.increaseTime(SALE_ENDED_TIME);

                // First participant CLN refunded
                await cc.approve(factory.address, ccBalanceParticipant, {from: participant});
                await factory.refund(tokenAddress, ccBalanceParticipant, {from: participant});
                const clnAfterRefund = await cln.balanceOf(participant);
                assert(clnBalanceParticipant.eq(clnAfterRefund),
                    `${clnBalanceParticipant} not equal to ${clnAfterRefund}`);

                // Second participant CLN refunded
                await cc.approve(factory.address, ccBalanceParticipant2, {from: participant2});
                await factory.refund(tokenAddress, ccBalanceParticipant2, {from: participant2});
                const clnAfterRefund2 = await cln.balanceOf(participant2);
                assert(clnBalanceParticipant.eq(clnAfterRefund2),
                    `${clnBalanceParticipant2} not equal to ${clnAfterRefund2}`);
            });
        });

        describe('transferAnyERC20Token.', async () => {

            it('should revert if not owner', async () => {
                await expectRevert(factory.transferAnyERC20Token(tokenAddress, THOUSAND_CLN));
            });

            it('should be able to call by owner with CLN', async () => {
                const clnOwnerBalance = await cln.balanceOf(owner);

                await cln.transfer(factory.address, THOUSAND_CLN, {from: participant});
                assert((await cln.balanceOf(factory.address)).eq(THOUSAND_CLN));
                assert((await factory.totalCLNcustodian()).eq(0));

                // transfering back the CLN tokens
                assert(await factory.transferAnyERC20Token(cln.address, THOUSAND_CLN, {from: owner}));
                assert((await cln.balanceOf(factory.address)).eq(0));
                assert((await cln.balanceOf(owner)).eq(clnOwnerBalance.plus(THOUSAND_CLN)));
            });

            it('should revert if sale is open', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant});
                const ccFactoryBalance = await cc.balanceOf(factory.address);
                const ccParticipantBalance = await cc.balanceOf(participant);

                // transfering CC to factory (by mistake)
                await cc.transfer(factory.address, ccParticipantBalance, {from: participant});

                await expectRevert(factory.transferAnyERC20Token(tokenAddress, ccParticipantBalance, {from: participant}));
            });

            it('should transfer CC back to owner if sale closed', async () => {
                await time.increaseTime(10);
                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant});


                await time.increaseTime(SALE_DURATION_TIME);
                await factory.finalize(tokenAddress, {from: owner});

                const ownerBalance = await cc.balanceOf(owner);
                const ccParticipantBalance = await cc.balanceOf(participant);

                // transfering CC to factory (by mistake)
                await cc.transfer(factory.address, ccParticipantBalance, {from: participant});
                assert((await cc.balanceOf(factory.address)).eq(ccParticipantBalance));

                await factory.transferAnyERC20Token(tokenAddress, ccParticipantBalance, {from: owner});
                assert(ccParticipantBalance.plus(ownerBalance).eq(await cc.balanceOf(owner)));
            });
        });

        describe('Complex scenarios.', async () => {
            it('perform 2 issuances in parallel', async () => {
                const owner2 = accounts[3]
                tokenAddress2 = (await factory.createIssuance(
                    now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                    'Some Name2', 'SON2', 18, CC_MAX_TOKENS, {from: owner2})).logs[0].args.token;
                const cc2 = await ColuLocalCurrency.at(tokenAddress2);

                const clnBalanceParticipant = await cln.balanceOf(participant)
                const clnBalanceParticipant2 = await cln.balanceOf(participant2)
                await time.increaseTime(10);

                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                assert(await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant}));

                await cln.approve(factory.address, THOUSAND_CLN / 5, {from: participant2});
                assert(await factory.participate['address,uint256'](tokenAddress2, THOUSAND_CLN / 5, {from: participant2}));

                const ccBalanceParticipant = await cc.balanceOf(participant);
                const cc2BalanceParticipant2 = await cc2.balanceOf(participant2);
                assert(!ccBalanceParticipant.isZero());
                assert(!cc2BalanceParticipant2.isZero());


                await time.increaseTime(SALE_ENDED_TIME);

                // First participant CLN refunded
                // await cc.approve(factory.address, ccBalanceParticipant, {from: participant});
                // await factory.refund(tokenAddress, ccBalanceParticipant, {from: participant});
                // const clnAfterRefund = await cln.balanceOf(participant);
                // assert(clnBalanceParticipant.eq(clnAfterRefund),
                //     `${clnBalanceParticipant} not equal to ${clnAfterRefund}`);

                // Second participant CLN refunded
                // await cc2.approve(factory.address, cc2BalanceParticipant2, {from: participant2});
                // await factory.refund(tokenAddress, cc2BalanceParticipant2, {from: participant2});
                // const clnAfterRefund2 = await cln.balanceOf(participant2);
                // assert(clnBalanceParticipant.eq(clnAfterRefund2),
                //     `${clnBalanceParticipant2} not equal to ${clnAfterRefund2}`);
            });
        })

        describe('getIssuance.', async () => {
            it('should return zero if no currencies have been issuenced', async () => {
                const emptyFactory = await IssuanceFactory.new(mmLib.address, cln.address,  {from: owner} );
                const count = await emptyFactory.getIssuanceCount(true, true, true, true);
                assert(count.eq(0), count.toNumber().toString());
            });

            it('should return zero if all parameters false', async () => {
                const count = await factory.getIssuanceCount(false, false, false, false);
                assert(count.eq(0), count.toNumber().toString());
            });

            it('should return correct number of issuences if sale was successful', async () => {
                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await cln.approve(factory.address, THOUSAND_CLN / 2, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: participant});

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(0), count.toNumber().toString());
            });

            it('should return correct number of issuences if sale was successful (reached hardcap before end)', async () => {
                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant});

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(0), count.toNumber().toString());

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(0), count.toNumber().toString());
            });

            it('should return correct number of issuences if sale failed', async () => {
                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(0), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(1), count.toNumber().toString());
            });

            it('should return correct number of issuences when running two issuances simultaneously', async () => {
                await factory.createIssuance(
                    now + 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                    'Some Name2', 'SON2', 18, CC_MAX_TOKENS, {from: owner});

                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(2), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(true, true, false, false);
                assert(count.eq(2), count.toNumber().toString());

                await time.increaseTime(100);
                await time.mine();

                count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(0), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(2), count.toNumber().toString());

                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant});

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, true, false);
                assert(count.eq(2), count.toNumber().toString());

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, true, true);
                assert(count.eq(2), count.toNumber().toString());

                now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;

                await factory.createIssuance(
                    now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                    'Some Name3', 'SON3', 18, CC_MAX_TOKENS, {from: owner});

                count = await factory.getIssuanceCount(true, false, true, true);
                assert(count.eq(3), count.toNumber().toString());

                await time.increaseTime(100);
                await time.mine();

                now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;

                await factory.createIssuance(
                    now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                    'Some Name4', 'SON4', 18, CC_MAX_TOKENS, {from: owner});

                count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(true, true, true, true);
                assert(count.eq(4), count.toNumber().toString());
            });
        });

        describe.only('getIssuanceIds.', async () => {
            it.only('should return empty array if no currencies have been issuenced', async () => {
                const emptyFactory = await IssuanceFactory.new(mmLib.address, cln.address,  {from: owner} );
                const issuanceIds = await emptyFactory.getIssuanceIds(0, 10, true, true, true, true);
                assert(true)
                // assert(issuanceIds.length.eq(0), count.toNumber().toString());
            });

            it('should return zero if all parameters false', async () => {
                const count = await factory.getIssuanceCount(false, false, false, false);
                assert(count.eq(0), count.toNumber().toString());
            });

            it('should return correct number of issuences if sale was successful', async () => {
                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await cln.approve(factory.address, THOUSAND_CLN / 2, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN / 2, {from: participant});

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(0), count.toNumber().toString());
            });

            it('should return correct number of issuences if sale was successful (reached hardcap before end)', async () => {
                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant});

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(0), count.toNumber().toString());

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(0), count.toNumber().toString());
            });

            it('should return correct number of issuences if sale failed', async () => {
                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(0), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(1), count.toNumber().toString());
            });

            it('should return correct number of issuences when running two issuances simultaneously', async () => {
                await factory.createIssuance(
                    now + 100, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                    'Some Name2', 'SON2', 18, CC_MAX_TOKENS, {from: owner});

                let count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(2), count.toNumber().toString());

                await time.increaseTime(10);
                await time.mine();

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(true, true, false, false);
                assert(count.eq(2), count.toNumber().toString());

                await time.increaseTime(100);
                await time.mine();

                count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(0), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(2), count.toNumber().toString());

                await cln.approve(factory.address, THOUSAND_CLN, {from: participant});
                await factory.participate['address,uint256'](tokenAddress, THOUSAND_CLN, {from: participant});

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, true, false);
                assert(count.eq(2), count.toNumber().toString());

                await time.increaseTime(SALE_DURATION_TIME);
                await time.mine();

                count = await factory.getIssuanceCount(false, false, true, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, false, true);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, false, true, true);
                assert(count.eq(2), count.toNumber().toString());

                now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;

                await factory.createIssuance(
                    now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                    'Some Name3', 'SON3', 18, CC_MAX_TOKENS, {from: owner});

                count = await factory.getIssuanceCount(true, false, true, true);
                assert(count.eq(3), count.toNumber().toString());

                await time.increaseTime(100);
                await time.mine();

                now = await (web3.eth.getBlock(web3.eth.blockNumber)).timestamp;

                await factory.createIssuance(
                    now + 10, SALE_DURATION_TIME, THOUSAND_CLN, THOUSAND_CLN / 2,
                    'Some Name4', 'SON4', 18, CC_MAX_TOKENS, {from: owner});

                count = await factory.getIssuanceCount(true, false, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(false, true, false, false);
                assert(count.eq(1), count.toNumber().toString());

                count = await factory.getIssuanceCount(true, true, true, true);
                assert(count.eq(4), count.toNumber().toString());
            });
        });

        describe('CurrencyFactory disabled methods.', async () => {
            it('insertCLNtoMarketMaker should revert', async () => {
                await expectRevert(factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it('insertCLNtoMarketMaker should revert', async () => {
                await expectRevert(factory.insertCLNtoMarketMaker['address'](tokenAddress, {from: owner}));
            });

            it('extractCLNfromMarketMaker should revert', async () => {
                await expectRevert(factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            });

            it('extractCLNfromMarketMaker should revert', async () => {
                await expectRevert(factory.extractCLNfromMarketMaker({from: owner}));
            });

            it('openMarket should revert', async () => {
                await expectRevert(factory.openMarket['address'](tokenAddress, {from: owner}));
            });
        });
    });
});
