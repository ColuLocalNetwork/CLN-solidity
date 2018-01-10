const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });
const _ = require('lodash');
const expectRevert = require('./helpers/expectRevert');
const time = require('./helpers/time');
const PresaleCalculator = require('./helpers/presaleCalculator');

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');
const ColuLocalNetworkSaleMock = artifacts.require('ColuLocalNetworkSaleMock');
const VestingTrustee = artifacts.require('VestingTrustee');

if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength, padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0,targetLength);
        }
    };
}

// Before tests are run, 10 accounts are created with 10M ETH assigned to each.
// see scripts/ dir for more information.
contract('ColuLocalNetworkSale', (accounts) => {
    const MINUTE = 60;
    const HOUR = 60 * MINUTE; // 3,600
    const DAY = 24 * HOUR;    // 86,400
    const WEEK = 7 * DAY;     // 604,800
    const YEAR = 365 * DAY;   // 31,536,000
    const MONTH = YEAR / 12;  // 2,628,000

    let DEFAULT_GAS_PRICE = new BigNumber(100000000000);
    let GAS_COST_ERROR = process.env['SOLIDITY_COVERAGE'] ? 30000000000000000 : 0;

    const TOKEN_DECIMALS = 10 ** 18;

    // Additional Lockup Allocation Pool
    const ALAP = new BigNumber('56387784051724178357919713')

    // Maximum number of tokens in circulation.
    const MAX_TOKENS = new BigNumber(15).mul(10 ** 8).mul(TOKEN_DECIMALS).add(ALAP);

    // Maximum tokens offered in the sale (35%).
    const MAX_TOKENS_SOLD = new BigNumber(525).mul(10 ** 6).mul(TOKEN_DECIMALS).add(ALAP);

    // Maximum tokens offered in the presale (from the initial 35% offered tokens).
    const MAX_PRESALE_TOKENS_SOLD = new BigNumber(2625).mul(10 ** 5).mul(TOKEN_DECIMALS).add(ALAP);

    // Tokens allocated for Community pool (30%).
    const COMMUNITY_POOL = new BigNumber(45).mul(10 ** 7).mul(TOKEN_DECIMALS);

    // Tokens allocated for Future development pool (29%).
    const FUTURE_DEVELOPMENT_POOL = new BigNumber(435).mul(10 ** 6).mul(TOKEN_DECIMALS);

    // Tokens allocated for stakeholders pool (6%).
    const STAKEHOLDERS_POOL = new BigNumber(9).mul(10 ** 7).mul(TOKEN_DECIMALS);

    const owner = accounts[0];
    // Received funds are forwarded to this address.
    const fundingRecipient = accounts[1];

    // Post-TDE multisig addresses.
    const communityPoolAddress = accounts[2];
    const futureDevelopmentPoolAddress = accounts[3];
    const stakeholdersPoolAddress = accounts[4];

    // CLN to ETH ratio.
    const CLN_PER_ETH = 13804;
    const presaleCalculator = PresaleCalculator(CLN_PER_ETH);

    const TIER_1_CAP = 300 * CLN_PER_ETH * TOKEN_DECIMALS;
    const TIER_2_CAP = new BigNumber(2).pow(256).minus(1);

    const HUNDRED_BILLION_TOKENS = Math.pow(10, 11) * TOKEN_DECIMALS;

    const VESTING_PLANS = {
        'A': {startOffset: 0, cliffOffset: 0, endOffset: 1 * DAY, installmentLength: 1 * DAY, alapPercent: 0},
        'B': {startOffset: 0, cliffOffset: 0, endOffset: 3 * DAY, installmentLength: 1 * DAY, alapPercent: 4},
        'C': {startOffset: 0, cliffOffset: 0, endOffset: 7 * DAY, installmentLength: 1 * DAY, alapPercent: 12},
        'D': {startOffset: 0, cliffOffset: 0, endOffset: 2 * YEAR, installmentLength: 1 * MONTH, alapPercent: 26},
        'E': {startOffset: 0, cliffOffset: 0, endOffset: 3 * YEAR, installmentLength: 1 * MONTH, alapPercent: 35}
    }

    const DEVELOPMENT_TOKEN_GRANT = {grantee: futureDevelopmentPoolAddress, value: FUTURE_DEVELOPMENT_POOL, startOffset: 0, cliffOffset: 7 * DAY, endOffset: 7 * DAY, installmentLength: 1 * DAY, revokable: false}

    const PRESALES = [
        {recipient: '0xA1018fEDe70680732c2464Ea689FE9dEE09E2E32', dolarInvest: 200000,  plan: 'B'},
        {recipient: '0x9AC4F6e64d56043991F486E375994F67ECbfdDE0', dolarInvest: 200000,  plan: 'A'},
        {recipient: '0x4DcBde0E4Fd2E3a80F2b054d69e8476967833db7', dolarInvest: 1734800, plan: 'C'},
        {recipient: '0x1ed4304324baf24e826f267861bfbbad50228599', dolarInvest: 1433400, plan: 'C'},
        {recipient: '0x6f46cf5569aefa1acc1009290c8e043747172d89', dolarInvest: 1147300, plan: 'B'},
        {recipient: '0x90e63c3d53e0ea496845b7a03ec7548b70014a91', dolarInvest: 1672200, plan: 'E'},
        {recipient: '0x53d284357ec70ce289d6d64134dfac8e511c8a3d', dolarInvest: 1280000, plan: 'D'},
        {recipient: '0xc257274276a4e539741ca11b590b9447b26a8051', dolarInvest: 1185100, plan: 'C'},
        {recipient: '0xf27daff52c38b2c373ad2b9392652ddf433303c4', dolarInvest: 1197000, plan: 'C'},
        {recipient: '0x3d2e397f94e415d7773e72e44d5b5338a99e77d9', dolarInvest: 1559100, plan: 'D'},
        {recipient: '0xb8487eed31cf5c559bf3f4edd166b949553d0d11', dolarInvest: 1958100, plan: 'A'},
        {recipient: '0x00a651d43b6e209f5ada45a35f92efc0de3a5184', dolarInvest: 1326400, plan: 'E'},
        {recipient: '0x1b3cb81e51011b549d78bf720b0d924ac763a7c2', dolarInvest: 1605000, plan: 'C'},
        {recipient: '0x6f52730dba7b02beefcaf0d6998c9ae901ea04f9', dolarInvest: 1621800, plan: 'B'},
        {recipient: '0x35da6abcb08f2b6164fe380bb6c47bd8f2304d55', dolarInvest: 1920000, plan: 'D'},
        {recipient: '0x51f9c432a4e59ac86282d6adab4c2eb8919160eb', dolarInvest: 1209200, plan: 'D'},
        {recipient: '0x8f7147aaa34d9ae583a7aa803e8df9bd6b4cc185', dolarInvest: 1404600, plan: 'C'},
        {recipient: '0x8eb3fa7907ad2ef4c7e3ba4b1d2f2aac6f4b5ae6', dolarInvest: 1250400, plan: 'D'},
        {recipient: '0x3bf86ed8a3153ec933786a02ac090301855e576b', dolarInvest: 1495600, plan: 'E'},
        {recipient: '0xc4832ffa32bd12a1696e3fe2ff2b44fc89d3e683', dolarInvest: 334800,  plan: 'C'}
    ]

    const FORMATED_PRESALE = presaleCalculator.calcPresale(PRESALES);

    let now;

    const increaseTime = async (by) => {
        await time.increaseTime(by);
        now += by;
    };

    // // Return a structured pre-sale grant for a specific address.
    // const getTokenGrant = async (sale, address) => {
    //     let tokenGrant = await sale.tokenGrants(address);

    //     return {
    //         value: tokenGrant[0].toNumber(),
    //         startOffset: tokenGrant[1].toNumber(),
    //         cliffOffset: tokenGrant[2].toNumber(),
    //         endOffset: tokenGrant[3].toNumber(),
    //         installmentLength: tokenGrant[4].toNumber(),
    //         percentVested: tokenGrant[5].toNumber()
    //     };
    // };

    // Return a structured vesting grant for a specific address.
    const getGrant = async (trustee, address) => {
        let grant = await trustee.grants(address);

        return {
            value: grant[0].toNumber(),
            start: grant[1].toNumber(),
            cliff: grant[2].toNumber(),
            end: grant[3].toNumber(),
            installmentLength: grant[4].toNumber(),
            transferred: grant[5].toNumber(),
            revokable: grant[6]
        };
    };

    const addPresaleAllocation = async (sale) => {
        for (let i = 0; i < FORMATED_PRESALE.length; i++) {
            let presale = FORMATED_PRESALE[i];
            console.log(`\t[${i + 1} / ${FORMATED_PRESALE.length}] adding pre-sale presale for ${presale[0]}...`);
            await sale.presaleAllocation(...presale);
        };
        console.log('\tpresaleTokensSold', (await sale.presaleTokensSold()).toString())
        assert.equal(MAX_PRESALE_TOKENS_SOLD, (await sale.presaleTokensSold()).toNumber())
    };

    // Checks if token grants exists.
    const ColuLocalNetworkGrantExists = async (sale, tokenGrant) => {
        let trustee = VestingTrustee.at(await sale.trustee());

        let grant = await getGrant(trustee, tokenGrant.grantee);
        let startTime = (await sale.startTime()).toNumber()
        assert.equal(grant.value, tokenGrant.value.toNumber(), 'grant values should be the same');
        assert.equal(grant.start, startTime + tokenGrant.startOffset, 'grant starts should be the same');
        assert.equal(grant.cliff, startTime + tokenGrant.cliffOffset, 'grant cliffs should be the same');
        assert.equal(grant.end, startTime + tokenGrant.endOffset, 'grant ends should be the same');
        assert.equal(grant.installmentLength, tokenGrant.installmentLength, 'grant installmentLengths should be the same');
        assert.equal(grant.revokable, tokenGrant.revokable, 'grant revokables should be the same');
    };

    const calcGrantFromPresale = (presale) => {
        let formatedPresale = presaleCalculator.calcPresale([presale])[0];

        console.log('formatedPresale', formatedPresale)

        let plan = VESTING_PLANS[presale.plan];

        let ALAPPerEth = new BigNumber(CLN_PER_ETH).mul(plan.alapPercent).div(100).floor();
        let tokensAndALAPPerEth = new BigNumber(CLN_PER_ETH).add(ALAPPerEth);
        let tokensAmount = tokensAndALAPPerEth.mul(formatedPresale[1]);

        console.log('!!!!!', ALAPPerEth, tokensAndALAPPerEth, tokensAmount)

        return {grantee: presale.recipient, value: tokensAmount, startOffset: plan.startOffset, cliffOffset: plan.cliffOffset, endOffset: plan.endOffset, installmentLength: plan.installmentLength, revokable: false}
    }

    // Checks if token presale grants exists.
    const ColuLocalNetworkPresaleGrantExists = async (sale, presale) => {
        let tokenGrant = calcGrantFromPresale(presale);
        return await ColuLocalNetworkGrantExists(sale, tokenGrant)
    };

    // Get block timestamp.
    beforeEach(async () => {
        now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    });

    describe('construction', async () => {
        it('should not allow to initialize with null owner address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(null, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with null funding recipient address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, null, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with null community pool address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, fundingRecipient, null, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with null future development pool address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, null, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with null stakeholders pool address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, null, now + 100));
        });

        it('should not allow to initialize with 0 owner address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(0, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with 0 funding recipient address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, 0, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with 0 community pool address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, fundingRecipient, 0, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with 0 future development pool address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, 0, stakeholdersPoolAddress, now + 100));
        });

        it('should not allow to initialize with 0 stakeholders pool address', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, 0, now + 100));
        });

        it('should not allow to initialize with a past starting time', async () => {
            await expectRevert(ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now - 100));
        });


        it('should be initialized with a derived ending time', async () => {
            let startTime = now + 100;
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, startTime);
            await sale.initialize();
            assert.equal((await sale.endTime()).toNumber(), startTime + (await sale.SALE_DURATION()).toNumber());
        });

        it('should not let initialized twice', async () => {
            let startTime = now + 100;
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, startTime);
            await sale.initialize();
            await expectRevert(sale.initialize());
        })

        it('should deploy the ColuLocalNetwork contract and own it', async () => {
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100);
            await sale.initialize();
            assert(await sale.cln() != 0);

            let token = ColuLocalNetwork.at(await sale.cln());
            assert.equal(await token.owner(), sale.address);
        });

        it('should deploy the VestingTrustee contract and own it', async () => {
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100);
            await sale.initialize();
            let token = ColuLocalNetwork.at(await sale.cln());

            let trustee = VestingTrustee.at(await sale.trustee());
            assert.equal(await trustee.cln(), token.address);
            assert.equal(await trustee.owner(), sale.address);
        });

        it('should be initialized in transferable false mode', async () => {
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100);
            await sale.initialize();
            let token = ColuLocalNetwork.at(await sale.cln());
            assert(!await token.isTransferable());
        });

        it('should be initialized with 0 total sold tokens', async () => {
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100);
            await sale.initialize();
            assert.equal((await sale.tokensSold()), 0);
        });

        it('should allocate token pools', async () => {
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 100);
            await sale.initialize();
            let token = ColuLocalNetwork.at(await sale.cln());
            assert.equal((await token.balanceOf(communityPoolAddress)).toNumber(), COMMUNITY_POOL.toNumber());
            assert.equal((await token.balanceOf(stakeholdersPoolAddress)).toNumber(), STAKEHOLDERS_POOL.toNumber());
        })

        it('should be ownable', async () => {
            let sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 10000);
            await sale.initialize();
            assert.equal(await sale.owner(), accounts[0]);
        });
    });

    describe.only('presaleAllocation', async () => {
        let sale;
        beforeEach(async () => {
            sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 1000);
            await sale.initialize();
        });

        it('should not allow to be called by non-owner', async () => {
            await expectRevert(sale.presaleAllocation(accounts[0], 1000, 0, {from: accounts[7]}));
        });

        it('should not allow to be called with null address', async () => {
            await expectRevert(sale.presaleAllocation(null, 1000, 0));
        });

        it('should not allow to be called with 0 address', async () => {
            await expectRevert(sale.presaleAllocation(0, 1000, 0));
        });

        it('should not allow to be called with 0 value', async () => {
            await expectRevert(sale.presaleAllocation(accounts[0], 0, 0));
        });

        it('should not allow granting the same address twice', async () => {
            await sale.presaleAllocation(accounts[0], 1000, 1);
            await expectRevert(sale.presaleAllocation(accounts[0], 5000, 0));
        });

        it('should not allow to make vesting of non existing plan', async () => {
            await expectRevert(sale.presaleAllocation(accounts[0], 1000, 7));
        });

        it.only('should add pre-sale token grants', async () => {
            await addPresaleAllocation(sale);

            for (const preSale of PRESALES) {
                console.log(`\tchecking if token grant for ${preSale.recipient} exists...`);

                await ColuLocalNetworkPresaleGrantExists(sale, preSale);
            }
        });
    });

    describe('participation caps', async () => {
        let sale;

        // Test all accounts have their participation caps set properly.
        beforeEach(async () => {
            sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, now + 1000);
            await sale.initialize();

            for (let participant of accounts) {
                assert.equal((await sale.participationCaps(participant)).toNumber(), 0);
            }
        });

        describe('setParticipationCap', async () => {
            it('should be able to get called with an empty list of participants', async () => {
                await sale.setParticipationCap([], TIER_1_CAP);
            });

            it('should not allow to be called by non-owner', async () => {
                await expectRevert(sale.setParticipationCap([], TIER_1_CAP, {from: accounts[7]}));
            });

            it('should set participation cap to TIER_1_CAP', async () => {
                let participants = [accounts[1], accounts[4]];

                await sale.setParticipationCap(participants, TIER_1_CAP);

                for (let participant of participants) {
                    assert.equal((await sale.participationCaps(participant)).toNumber(), TIER_1_CAP);
                }
            });

            it('should allow upgrading existing participants to tier2', async () => {
                let participants = [accounts[2], accounts[3], accounts[4]];
                await sale.setParticipationCap(participants, TIER_1_CAP);

                for (let participant of participants) {
                    assert.equal((await sale.participationCaps(participant)).toNumber(), TIER_1_CAP);
                }
                await sale.setParticipationCap(participants, TIER_2_CAP);
                for (let participant of participants) {
                    assert.equal((await sale.participationCaps(participant)).toNumber(), TIER_2_CAP);
                }
            });
        });
    });

    describe('finalize', async () => {
        let sale;
        let token;
        let start;
        let startFrom = 1000;
        let end;

        beforeEach(async () => {
            start = now + startFrom;
            sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, start);
            await sale.initialize();
            end = (await sale.endTime()).toNumber();
            token = ColuLocalNetwork.at(await sale.cln());

            assert.equal(await token.isTransferable(), false);
        });

        context('before sale has started', async () => {
            beforeEach(async () => {
                assert.isBelow(now, start);
            });

            it('should not allow to finalize before selling all tokens', async () => {
                await expectRevert(sale.finalize());
            });
        });

        context('during the sale', async () => {
            beforeEach(async () => {
                // Increase time to be the in the middle between start and end.
                await increaseTime(start - now + ((end - start) / 2));

                assert.isAbove(now, start);
                assert.isBelow(now, end);
            });

            it('should not allow to finalize before selling all tokens', async () => {
                await expectRevert(sale.finalize());
            });
        });

        let testFinalization = async () => {
            it('should finish minting after sale was finalized', async () => {
                await sale.finalize();

                assert.equal(await token.isTransferable(), true);
            });

            it('should not allow to finalize token sale more than once', async () => {
                await sale.finalize();

                await expectRevert(sale.finalize());
            });

            it('should test development pool token grants', async () => {
                await sale.finalize();

                let tokensSold = await sale.tokensSold();
                let tokensLeftInSale = MAX_TOKENS_SOLD.sub(tokensSold);
                let developmentTokenGrant = _.clone(DEVELOPMENT_TOKEN_GRANT);
                developmentTokenGrant.value = developmentTokenGrant.value.add(tokensLeftInSale);
                await ColuLocalNetworkGrantExists(sale, developmentTokenGrant);
            });
        }

        context('after sale time has ended', async () => {
            beforeEach(async () => {
                await increaseTime(end - now + 1);
                assert.isAbove(now, end);
            });

            context('sold all of the tokens', async () => {
                beforeEach(async () => {
                    await sale.setTokensSold(MAX_TOKENS_SOLD);
                });

                testFinalization();
            });

            context('sold only half of the tokens', async () => {
                beforeEach(async () => {
                    await sale.setTokensSold(MAX_TOKENS_SOLD.div(2));
                });

                testFinalization();
            });

            context('sold only tenth of the tokens', async () => {
                beforeEach(async () => {
                    await sale.setTokensSold(MAX_TOKENS_SOLD.div(10));
                });

                testFinalization();
            });
        });

        context('reached token cap', async () => {
            beforeEach(async () => {
                await sale.setTokensSold(MAX_TOKENS_SOLD);
            });

            testFinalization();
        });
    });

    // Execute a transaction, and test balances and total tokens sold have been updated correctly, while also testing
    // for participation caps.
    //
    // NOTE: This function automatically finalizes the sale when the cap has been reached. This function is used in
    // various tests where plenty of transactions are called, and its hard to decide when to exactly call finalize. This
    // function does it for us.
    let verifyTransactions = async (sale, fundRecipient, method, transactions) => {
        let token = ColuLocalNetwork.at(await sale.cln());

        // Using large numerics, so we have to use BigNumber.
        let totalTokensSold = await sale.tokensSold();;

        let i = 0;
        for (const t of transactions) {
            // Set hard participation cap if mentioned in current transaction object. This means current object is not
            // a transaction but a special object that signals when to set a new hard cap.
            //
            // NOTE: We have to convert the new cap number to string before converting them to BigNumber, since JS
            // standard Number type doesn't support more than 15 significant digits.
            if (t.hasOwnProperty('hardParticipationCap')) {
                console.log(`\tsetting hard participation cap from ${(await sale.hardParticipationCap()).div(TOKEN_DECIMALS)} ` +
                    `to ${t.hardParticipationCap / TOKEN_DECIMALS}`
                );

                // Value is assumed to be of BigNumber type.
                await sale.setHardParticipationCap(t.hardParticipationCap);

                continue;
            }

            let tokens = new BigNumber(t.value.toString()).mul(CLN_PER_ETH);

            console.log(`\t[${++i} / ${transactions.length}] expecting account ${t.from} to buy up to ` +
                `${tokens.toNumber() / TOKEN_DECIMALS} CLN for ${t.value / TOKEN_DECIMALS} ETH`
            );

            // Cache original balances before executing the transaction.
            // We will test against these after the transaction has been executed.
            let fundRecipientETHBalance = web3.eth.getBalance(fundRecipient);
            let participantETHBalance = web3.eth.getBalance(t.from);
            let participantCLNBalance = await token.balanceOf(t.from);
            let participantHistory = await sale.participationHistory(t.from);

            // Take into account the global hard participation cap.
            let participantCap = await sale.participationCaps(t.from);
            let hardParticipationCap = await sale.hardParticipationCap();
            participantCap = BigNumber.min(participantCap, hardParticipationCap);

            let tokensSold = await sale.tokensSold();
            assert.equal(totalTokensSold.toNumber(), tokensSold.toNumber());

            // If this transaction should fail, then theres no need to continue testing the current transaction and
            // test for updated balances, etc., since everything related to it was reverted.
            //
            // Reasons for failures can be:
            //  1. We already sold all the tokens
            //  2. Participant has reached its participation cap.
            if (MAX_TOKENS_SOLD.equals(tokensSold) ||
                participantHistory.greaterThanOrEqualTo(participantCap)) {
                await expectRevert(method(sale, t.value, t.from));

                continue;
            }

            // Prediction of correct participant ETH, CLN balance, and total tokens sold:

            // NOTE: We take into account partial refund to the participant, in case transaction goes past its
            // participation cap.
            //
            // NOTE: We have to convert the (very) numbers to strings, before converting them to BigNumber, since JS
            // standard Number type doesn't support more than 15 significant digits.
            let contribution = BigNumber.min(t.value.toString(), participantCap.minus(participantHistory));
            tokens = contribution.mul(CLN_PER_ETH);

            // Take into account the remaining amount of tokens which can be still sold:
            tokens = BigNumber.min(tokens, MAX_TOKENS_SOLD.minus(tokensSold));
            contribution = tokens.div(CLN_PER_ETH);

            totalTokensSold = totalTokensSold.plus(tokens);

            // Execute transaction.

            let transaction = await method(sale, t.value, t.from);
            let gasUsed = DEFAULT_GAS_PRICE.mul(transaction.receipt.gasUsed);


            // Test for total tokens sold.
            assert.equal((await sale.tokensSold()).toNumber(), tokensSold.plus(tokens).toNumber());
            // Test for correct participant ETH + CLN balances.

            // ETH:
            assert.equal(web3.eth.getBalance(fundRecipient).toNumber(),
                fundRecipientETHBalance.plus(contribution).toNumber());

            assert.approximately( web3.eth.getBalance(t.from).toNumber(),
                participantETHBalance.minus(contribution).minus(gasUsed).toNumber(), GAS_COST_ERROR);

            // CLN:
            assert.equal((await token.balanceOf(t.from)).toNumber(), participantCLNBalance.plus(tokens).toNumber());

            // Test for updated participant cap.
            assert.equal((await sale.participationHistory(t.from)).toNumber(),
                participantHistory.plus(contribution).toNumber());

            // Test owner transfer event.
            assert.lengthOf(transaction.logs, 1);
            let event = transaction.logs[0];
            assert.equal(event.event, 'TokensIssued');
            assert.equal(Number(event.args.tokens), tokens)

            // Finalize sale if the all tokens have been sold.
            if (totalTokensSold.equals(MAX_TOKENS_SOLD)) {
                await sale.finalize();
            }
        }
    };

    let generateTokenTests = async (name, method) => {
        describe(name, async () => {
            let sale;
            let token;
            // accounts[0] (owner) is participating in the sale. We don't want
            // him to send and receive funds at the same time.
            let fundRecipient = accounts[11];
            let tier2Participant = accounts[9];
            let start;
            let startFrom = 1000;
            let end;
            let value = 1000;

            beforeEach(async () => {
                start = now + startFrom;
                sale = await ColuLocalNetworkSaleMock.new(owner, fundRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, start);
                await sale.initialize();
                end = (await sale.endTime()).toNumber();
                token = ColuLocalNetwork.at(await sale.cln());

                assert.equal(await token.isTransferable(), false);
                await addPresaleAllocation(sale);
                await sale.setParticipationCap([tier2Participant], TIER_2_CAP);
            });

            context('sale time has ended', async () => {
                beforeEach(async () => {
                    await increaseTime(end - now + 1);
                    assert.isAbove(now, end);
                });

                it('should not allow to execute', async () => {
                    await expectRevert(method(sale, value));
                });

                context('and finalized', async () => {
                    beforeEach(async () => {
                        await sale.finalize();
                    });

                    it('should not allow to execute', async () => {
                        await expectRevert(method(sale, value));
                    });
                });
            });

            context('reached token cap', async () => {
                beforeEach(async () => {
                    await sale.setTokensSold(MAX_TOKENS_SOLD);
                    assert.equal((await sale.tokensSold()).toNumber(), MAX_TOKENS_SOLD.toNumber());
                });

                it('should not allow to execute', async () => {
                    await expectRevert(method(sale, value));
                });

                context('and finalized', async () => {
                    beforeEach(async () => {
                        await sale.finalize();
                    });

                    it('should not allow to execute', async () => {
                        await expectRevert(method(sale, value));
                    });
                });
            });

            context('before sale has started', async () => {
                beforeEach(async () => {
                    assert.isBelow(now, start);
                });

                it('should not allow to execute', async () => {
                    await expectRevert(method(sale, value));
                });
            });

            context('during the sale', async () => {
                beforeEach(async () => {
                    await increaseTime(start - now + ((end - start) / 2));
                    assert.isAbove(now, start);
                    assert.isBelow(now, end);
                });

                it('should not allow to execute with 0 ETH', async () => {
                    await expectRevert(method(sale, 0));
                });

                // Test if transaction execution is unallowed and prevented for UNREGISTERED participants.
                context('unregistered participants', async () => {
                    [
                        { from: accounts[1], value: 1 * TOKEN_DECIMALS },
                        { from: accounts[2], value: 2 * TOKEN_DECIMALS },
                        { from: accounts[3], value: 0.0001 * TOKEN_DECIMALS },
                        { from: accounts[4], value: 10 * TOKEN_DECIMALS }
                    ].forEach((t) => {
                        it(`should not allow to participate with ${t.value / TOKEN_DECIMALS} ETH`, async () => {
                            assert.equal((await sale.participationCaps(t.from)).toNumber(), 0);

                            await expectRevert(method(sale, t.value));
                        });
                    });
                });

                // Test transaction are allowed and executed correctly for registered participants.
                context('registered participants', async () => {
                    let owner = accounts[0];

                    let tier1Participant1 = accounts[1];
                    let tier1Participant2 = accounts[2];
                    let tier1Participant3 = accounts[3];

                    let tier2Participant1 = accounts[4];
                    let tier2Participant2 = accounts[5];
                    let tier2Participant3 = accounts[6];  // Not used in following tests. "Dummy" account.

                    // Use default (limited) hard participation cap
                    // and initialize tier 1 + tier 2 participants.
                    beforeEach(async () => {
                        await sale.setParticipationCap([
                            owner,
                            tier1Participant1,
                            tier1Participant2,
                            tier1Participant3
                        ], TIER_1_CAP);
                        await sale.setParticipationCap([
                            tier2Participant1,
                            tier2Participant2,
                            tier2Participant3,
                        ], TIER_2_CAP);
                    });

                    [
                        // Sanity test: test sending funds from account owner. Bulk 0
                        [
                            { from: owner, value: 1 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 1 * TOKEN_DECIMALS },
                            { from: owner, value: 1 * TOKEN_DECIMALS },
                            { from: owner, value: 3 * TOKEN_DECIMALS },
                        ],
                        // Only tier 1 participants: Bulk 1
                        [
                            { from: tier1Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 150 * TOKEN_DECIMALS }
                        ],
                        // Tier 1 + Tier 2 participants: Bulk 2
                        [
                            { from: tier1Participant1, value: 1 * TOKEN_DECIMALS },

                            { from: tier1Participant2, value: 0.5 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 10 * TOKEN_DECIMALS },

                            { from: tier2Participant1, value: 100 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 0.01 * TOKEN_DECIMALS },

                            { from: tier1Participant3, value: 2.5 * TOKEN_DECIMALS },

                            { from: tier1Participant2, value: 0.01 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 1200 * TOKEN_DECIMALS },

                            { from: tier1Participant1,  value: 0.01 * TOKEN_DECIMALS }
                        ],
                        // Another Tier 1 + Tier 2 participants: Bulk 3
                        [
                            { from: tier1Participant1, value: 5 * TOKEN_DECIMALS },

                            { from: tier1Participant2, value: 100 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 100 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 2 * TOKEN_DECIMALS },

                            { from: tier2Participant2, value: 1000 * TOKEN_DECIMALS },

                            { from: tier1Participant3, value: 1.3 * TOKEN_DECIMALS },

                            { from: tier1Participant2, value: 0.01 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 100 * TOKEN_DECIMALS },

                            { from: tier1Participant1, value: 0.01 * TOKEN_DECIMALS }
                        ],
                        // Participation cap should be reached by the middle of this transaction list, and then we raise
                        // it and continue the remaining transactions: Bulk 4
                        [
                            { from: tier1Participant1, value: 11 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 12 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 13 * TOKEN_DECIMALS },

                            { from: tier2Participant1, value: 21 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 211 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 22 * TOKEN_DECIMALS },

                            { from: tier1Participant1, value: 5000 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1000000 * TOKEN_DECIMALS }, // 1M

                            { hardParticipationCap: TIER_2_CAP }, // Practically infinity

                            { from: tier1Participant1, value: 10000 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 121 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1000000 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 131 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 5000000 * TOKEN_DECIMALS }, // 5M
                            { from: tier1Participant2, value: 1212 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 8000000 * TOKEN_DECIMALS } // 8M
                        ],
                        // Another similar test to above, just with different transactions. Bulk 5
                        [
                            { from: tier2Participant1, value: 100 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 1000 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 10000 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 100 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 0.1 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 0.01 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 10 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 1000000 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1000 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 999 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 9999 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 99 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 10 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 10 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 100 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 100000 * TOKEN_DECIMALS },

                            { hardParticipationCap: TIER_2_CAP },

                            { from: tier2Participant1, value: 1000000 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 121 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 5000000 * TOKEN_DECIMALS }, // 5M
                            { from: tier1Participant3, value: 131 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 8000000 * TOKEN_DECIMALS }, // 50M
                            { from: tier1Participant1, value: 10000 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 1212 * TOKEN_DECIMALS }
                        ],
                        // Test starting with hard cap at the lowest value possible: 1,
                        // then rising to 5K. Bulk 6
                        [
                            { hardParticipationCap: new BigNumber(1) },

                            { from: tier2Participant1, value: 100 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 1000 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 10000 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 100 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 0.1 * TOKEN_DECIMALS },
                            { from: tier1Participant1, value: 0.01 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 10 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 1000000 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1000 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 999 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 9999 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 99 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 10 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 10 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 1 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 100 * TOKEN_DECIMALS },
                            { from: tier1Participant3, value: 100000 * TOKEN_DECIMALS },

                            { hardParticipationCap: new BigNumber(5).mul(1000) }, // 5K

                            { from: tier2Participant1, value: 1000000 * TOKEN_DECIMALS }, // 1M
                            { from: tier1Participant2, value: 121 * TOKEN_DECIMALS },
                            { from: tier2Participant1, value: 5000000 * TOKEN_DECIMALS }, // 5M
                            { from: tier1Participant3, value: 131 * TOKEN_DECIMALS },
                            { from: tier2Participant2, value: 8000000 * TOKEN_DECIMALS }, // 50M
                            { from: tier1Participant1, value: 10000 * TOKEN_DECIMALS },
                            { from: tier1Participant2, value: 1212 * TOKEN_DECIMALS }
                        ],
                    ].forEach((transactions, i) => {
                        context(`bulk ${i}...`, async function() {
                            // These are long tests, so we need to disable timeouts.
                            this.timeout(0);

                            it('should execute sale orders', async () => {
                                await verifyTransactions(sale, fundRecipient, method, transactions);
                            });
                        });
                    });
                });
            });
        });
    }

    // Generate tests for participate() - Create and sell tokens to the caller.
    generateTokenTests('using participate()', async (sale, value, from) => {
        let account = from || accounts[0];
        return sale.participate(account, {value: value, from: account});
    });

    // Generate tests for fallback method - Should be same as participate().
    generateTokenTests('using fallback function', async (sale, value, from) => {
        if (from) {
            return sale.sendTransaction({value: value, from: from});
        }

        return sale.send(value);
    });

    describe('transfer ownership', async () => {
        let sale;
        let token;
        let trustee;
        let start;
        let startFrom = 1000;
        let end;

        beforeEach(async () => {
            start = now + startFrom;
            sale = await ColuLocalNetworkSaleMock.new(owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, start);
            await sale.initialize();
            end = (await sale.endTime()).toNumber();
            token = ColuLocalNetwork.at(await sale.cln());
        });

        // test token contract ownership transfer tests.
        let testTransferAndAcceptTokenOwnership = async () => {
            let owner = accounts[0];
            let newOwner = accounts[1];
            let notOwner = accounts[8];

            describe('test token contract ownership transfer', async () => {
                describe('request', async () => {
                    it('should allow contract owner to request transfer', async () => {
                        assert.equal(await token.owner(), sale.address);

                        await sale.requestColuLocalNetworkOwnershipTransfer(newOwner, {from: owner});
                    });

                    it('should not allow non-owner to request transfer', async () => {
                        await expectRevert(sale.requestColuLocalNetworkOwnershipTransfer(newOwner, {from: notOwner}));
                    });
                });

                describe('accept', async () => {
                    it('should not allow owner to accept', async () => {
                        await expectRevert(token.acceptOwnership({from: owner}));
                    });

                    it('should not allow new owner to accept without request', async () => {
                        await expectRevert(token.acceptOwnership({from: newOwner}));
                    });
                });

                describe('request and accept', async () => {
                    it('should transfer ownership to new owner', async () => {
                        // Test original owner is still owner before and after ownership REQUEST (not accepted yet!).
                        assert.equal(await token.owner(), sale.address);
                        await sale.requestColuLocalNetworkOwnershipTransfer(newOwner, {from: owner});
                        assert.equal(await token.owner(), sale.address);

                        // Test ownership has been transferred after acceptance.
                        await token.acceptOwnership({from: newOwner});
                        assert.equal(await token.owner(), newOwner);

                        // Original owner should not be able to request ownership after acceptance (he's not the owner
                        // anymore).
                        await expectRevert(sale.requestColuLocalNetworkOwnershipTransfer(newOwner, {from: owner}));
                    });

                    it('should be able to claim ownership back', async () => {
                        // Transfer ownership to another account.
                        assert.equal(await token.owner(), sale.address);
                        await sale.requestColuLocalNetworkOwnershipTransfer(newOwner, {from: owner});
                        await token.acceptOwnership({from: newOwner});
                        assert.equal(await token.owner(), newOwner);

                        // Test transfer ownership back to original account.
                        await token.requestOwnershipTransfer(sale.address, {from: newOwner});
                        assert.equal(await token.owner(), newOwner);

                        await sale.acceptColuLocalNetworkOwnership({from: owner});
                        assert.equal(await token.owner(), sale.address);
                    });
                });
            });
        };

        // Vesting trustee contract ownership transfer tests.
        let testTransferAndAcceptVestingTrusteeOwnership = async () => {
            let owner = accounts[0];
            let newOwner = accounts[1];
            let notOwner = accounts[8];

            describe('Vesting Trustee contract ownership transfer', async () => {
                describe('request', async () => {
                    it('should allow for contract owner', async () => {
                        assert.equal(await trustee.owner(), sale.address);

                        await sale.requestVestingTrusteeOwnershipTransfer(newOwner, {from: owner});
                    });

                    it('should not allow for non-contract owner', async () => {
                        await expectRevert(sale.requestVestingTrusteeOwnershipTransfer(newOwner, {from: notOwner}));
                    });
                });

                describe('accept', async () => {
                    it('should not allow owner to accept', async () => {
                        await expectRevert(sale.acceptVestingTrusteeOwnership({from: notOwner}));
                    });

                    it('should not allow new owner to accept without request', async () => {
                        await expectRevert(sale.acceptVestingTrusteeOwnership({from: notOwner}));
                    });
                });

                describe('request and accept', async () => {
                    it('should transfer ownership to new owner', async () => {
                        // Test original owner is still owner before and
                        // after ownership REQUEST (not accepted yet!).
                        assert.equal(await token.owner(), sale.address);
                        await sale.requestVestingTrusteeOwnershipTransfer(newOwner, {from: owner});
                        assert.equal(await trustee.owner(), sale.address);

                        // Test ownership has been transferred after acceptance.
                        await trustee.acceptOwnership({from: newOwner});
                        assert.equal(await trustee.owner(), newOwner);

                        // Original owner should not be able to request
                        // ownership after acceptance (he's not the owner anymore).
                        await expectRevert(sale.requestVestingTrusteeOwnershipTransfer(newOwner, {from: owner}));
                    });

                    it('should be able to claim ownership back', async () => {
                        // Transfer ownership to another account.
                        assert.equal(await trustee.owner(), sale.address);
                        await sale.requestVestingTrusteeOwnershipTransfer(newOwner, {from: owner});
                        await trustee.acceptOwnership({from: newOwner});
                        assert.equal(await trustee.owner(), newOwner);

                        // Test transfer ownership back to original account.
                        await trustee.requestOwnershipTransfer(sale.address, {from: newOwner});
                        assert.equal(await trustee.owner(), newOwner);

                        await sale.acceptVestingTrusteeOwnership({from: owner});
                        assert.equal(await trustee.owner(), sale.address);
                    });
                });
            });
        };

        context('during the sale', async () => {
            beforeEach(async () => {
                await increaseTime(start - now + ((end - start) / 2));

                assert.isAbove(now, start);
                assert.isBelow(now, end);
            });

            testTransferAndAcceptTokenOwnership();
        });

        context('after the sale', async () => {
            context('reached token cap', async () => {
                beforeEach(async () => {
                    await sale.setTokensSold(MAX_TOKENS_SOLD);
                    await sale.finalize();

                    trustee = VestingTrustee.at(await sale.trustee());
                });

                testTransferAndAcceptTokenOwnership();
                testTransferAndAcceptVestingTrusteeOwnership();
            });

            context('after the ending time', async () => {
                beforeEach(async () => {
                    await increaseTime(end - now + 1);
                    assert.isAbove(now, end);

                    await sale.finalize();

                    trustee = VestingTrustee.at(await sale.trustee());
                });

                testTransferAndAcceptTokenOwnership();
                testTransferAndAcceptVestingTrusteeOwnership();
            });
        });
    });

    const longTests = process.env['LONG_TESTS'];
    (longTests ? describe : describe.skip)('long token sale scenarios', async function() {
        // These are very long tests, so we need to  disable timeouts.
        this.timeout(0);

        let sale;
        let token;
        let tier1Participants;
        let tier2Participants;
        let start;
        let startFrom = 1000;
        let end;
        let fundRecipient = accounts[0];

        // Center index in accounts array.
        const centerIndex = Math.floor(accounts.length / 2);

        // Setup a standard sale just like previous tests, with a single tier 2 participant
        // and move time to be during the sale.
        beforeEach(async () => {
            start = now + startFrom;
            sale = await ColuLocalNetworkSaleMock.new(owner, fundRecipient, communityPoolAddress, futureDevelopmentPoolAddress, stakeholdersPoolAddress, start);
            await sale.initialize();
            end = (await sale.endTime()).toNumber();
            await addPresaleAllocation(sale);
            token = ColuLocalNetwork.at(await sale.cln());

            // We'll be testing transactions from all these accounts in the following tests.
            // We require at least 50 (ignoring first owner account).
            assert.isAtLeast(accounts.length, 51);

            // We're generating transactions for many accounts and also skipping the first owner account.
            // We split these accounts to two tiers, thus in order for them to be equal
            // length we need an odd (accounts.length) value
            assert.equal(accounts.length % 2, 1);

            await increaseTime(start - now + 1);
            assert.isAtLeast(now, start);
            assert.isBelow(now, end);
        });

        let participate = async (sale, value, from) => {
            let account = from || accounts[0];
            return sale.participate(account, {value: value, from: account});
        };

        const WHITELIST_SIZE = 50000;

        // NOTE (accounts.length - 1) because we're skipping first owner account.
        context(`${WHITELIST_SIZE + accounts.length - 1} registered participants`, async () => {
            const BATCH_SIZE = 200;

            // Whitelist participants along with random addresses:

            beforeEach(async () => {

                // Assign random addresses (as noise) to tier 1.
                for (let i = 0; i < WHITELIST_SIZE / BATCH_SIZE; ++i) {
                    console.log(`\tWhitelisting [${i * BATCH_SIZE} - ${(i + 1) * BATCH_SIZE}] non-existing participants...`);
                    const addresses = Array.from(Array(BATCH_SIZE), (_, x) => {
                        return '0x'.padEnd(42, x + (i + 1) * BATCH_SIZE)
                    });

                    await sale.setParticipationCap(addresses, TIER_1_CAP);
                }
                // Assign 50% of participants to tier 1 and the other to tier 2.
                //
                // NOTE skipping owner account.
                tier1Participants = accounts.slice(1, centerIndex + 1);
                tier2Participants = accounts.slice(centerIndex + 1, accounts.length);

                console.log(`\tWhitelisting ${tier1Participants.length} tier 1 participants...`);
                await sale.setParticipationCap(tier1Participants, TIER_1_CAP);

                console.log(`\tWhitelisting ${tier2Participants.length} tier 2 participants...`);
                await sale.setParticipationCap(tier2Participants, TIER_2_CAP);
            });

            it('should be able to participate', async () => {
                // Generate transactions, and mix tier 1 and tier 2 transactions together.
                let transactions = [];
                for (let i = 0; i < centerIndex; ++i) {
                    // NOTE value is (i+1) such that first member will send 1 ETH (0 ETH will fail).
                    transactions.push({from: tier1Participants[i], value: new BigNumber(i + 1).mul(TOKEN_DECIMALS)});
                    transactions.push({from: tier2Participants[i], value: new BigNumber(i + 1).mul(10).mul(TOKEN_DECIMALS)});
                }

                await verifyTransactions(sale, fundRecipient, participate, transactions);
            });

            // This test generates very small and very large transactions. During the sale,
            // the hard cap is lifted to infinity, and then we test the very large
            // transactions are succeeding, and the sale is finalized.
            //
            // We're trying to create "chaotic" behaviour by mixing small and large transactions together.
            it('should be able to participate in various amounts with changing sale cap', async () => {
                // Generate transactions, and mix tier 1 and tier 2 transactions together.
                let transactions = [];
                let liftHardCapIndex = 75;
                for (let j = 0; j < 100; ++j) {
                    // Lift hard cap to infinity during the sale.
                    if (j === 70) {
                        console.log(`\tGenerating hard participation cap change...`);
                        transactions.push({ hardParticipationCap: TIER_2_CAP });
                    }

                    console.log(`\tGenerating ${tier1Participants.length} transactions...`);
                    for (let i = 0; i < centerIndex; ++i) {
                        // NOTE value is (i+1) such that first member will send 1 ETH (0 ETH will fail).

                        // Tier 1 participants send a negligble amount of ETH (0.01-0.25 ETH).
                        transactions.push({from: tier1Participants[i], value: new BigNumber(i + 1).mul(0.01).mul(TOKEN_DECIMALS)});

                        // Tier 2 participants start with sending 1-25 ETH every iteration,
                        // Then after the hard cap has been lifted, send 500-12500 ETH.
                        let tier2Value = j < liftHardCapIndex ? 1 : 500;
                        transactions.push({from: tier2Participants[i], value: new BigNumber(i + 1).mul(tier2Value).mul(TOKEN_DECIMALS)});
                    }
                }

                await verifyTransactions(sale, fundRecipient, participate, transactions);
            });
        });
    });
});