const expectRevert = require('./helpers/expectRevert');
const coder = require('web3-eth-abi');
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');
const EllipseMarketMaker = artifacts.require('EllipseMarketMaker');
const EllipseMarketMakerLib = artifacts.require('EllipseMarketMakerLib');
const IEllipseMarketMaker = artifacts.require('IEllipseMarketMaker');

const TOKEN_DECIMALS = 10 ** 18;

const CLN_MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS;
const CC_MAX_TOKENS = 15 * 10 ** 6 * TOKEN_DECIMALS;

const INITIALIZE_ON_TRANSFER_ABI = {
    name: 'initializeOnTransfer',
    type: 'function',
    inputs: []
};

const CHANGE_ON_TRANSFER_ABI = {
    name: 'change',
    type: 'function',
    inputs: [
        {
            type: 'address',
            name: 'toToken'
        }
    ]
}

const CHANGE_ON_TRANSFER_WITH_MIN_ABI = {
    name: 'change',
    type: 'function',
    inputs: [
        {
            type: 'address',
            name: 'toToken'
        },
        {
            type: 'uint256',
            name: 'minReturn'
        }
    ]
}

const INITIALIZE_ON_TRANSFER_DATA = coder.encodeFunctionCall(INITIALIZE_ON_TRANSFER_ABI, []);

const CHANGE_SIGS = {
    afterApprove: 'address,uint256,address',
    afterApproveWithMin: 'address,uint256,address,uint256',
    onTransfer: 'address',
    onTransferWithMin: 'address,uint256',
};

const encodeChangeData = (toToken, minReturn) => {
    let abi, params;
    if (minReturn) {
        abi = CHANGE_ON_TRANSFER_WITH_MIN_ABI;
        params = [toToken, minReturn];
    } else {
        abi = CHANGE_ON_TRANSFER_ABI;
        params = [toToken];
    }
    return coder.encodeFunctionCall(abi, params);
};

contract('EllipseMarketMaker', (accounts) => {
    let cln;
    let cc;
    let lib;

    let marketMaker;

    let owner = accounts[0];
    let nonOwner = accounts[1];

    let amount = 10000000 * TOKEN_DECIMALS;

    beforeEach(async () => {
        lib = await EllipseMarketMakerLib.new();
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        cc = await ColuLocalNetwork.new(CC_MAX_TOKENS);
    });

    describe('construction', async () => {
        it('should not constract with lib null', async () => {
            await expectRevert(EllipseMarketMaker.new(null, cln.address, cc.address, {from: accounts[0]}));
        });
        
        it('should not constract with lib 0', async () => {
            await expectRevert(EllipseMarketMaker.new(0, cln.address, cc.address, {from: accounts[0]}));
        });

        it('should not constract with token1 null', async () => {
            await expectRevert(EllipseMarketMaker.new(lib.address, null, cc.address, {from: accounts[0]}));
        });
        
        it('should not constract with token1 0', async () => {
            await expectRevert(EllipseMarketMaker.new(lib.address, 0, cc.address, {from: accounts[0]}));
        });
        
        it('should not constract with token2 null', async () => {
            await expectRevert(EllipseMarketMaker.new(lib.address, cln.address, null, {from: accounts[0]}));
        });
        
        it('should not constract with token2 0', async () => {
            await expectRevert(EllipseMarketMaker.new(lib.address, cln.address, 0, {from: accounts[0]}));
        });
        
        it('should not constract same token', async () => {
            await expectRevert(EllipseMarketMaker.new(lib.address, cc.address, cc.address, {from: accounts[0]}));
        });

        it('should constract with in non operational mode', async () => {
            marketMaker = await EllipseMarketMaker.new(lib.address, cln.address, cc.address);
            marketMaker = IEllipseMarketMaker.at(marketMaker.address);
            assert(!(await marketMaker.operational()));
            assert(!(await marketMaker.openForPublic()));
        });
    });

    describe('going operational', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            await cc.makeTokensTransferable();
            marketMaker = await EllipseMarketMaker.new(lib.address, cln.address, cc.address);
            marketMaker = IEllipseMarketMaker.at(marketMaker.address);
            assert(!(await marketMaker.operational()));
            assert(!(await marketMaker.openForPublic()));
        });

        it('should not be able to change state to operational without preconditions, using after transfer', async () => {
            await expectRevert(marketMaker.initializeAfterTransfer());
        });

        it('should not be able to change state to operational without preconditions, using on transfer', async () => {
            await expectRevert(marketMaker.initializeOnTransfer());
        });

        it('should be able to change state to operational after transfer', async () => {
            await cc.transfer(marketMaker.address, await cc.totalSupply());
            await marketMaker.initializeAfterTransfer();
            assert(await marketMaker.operational());
            assert(!(await marketMaker.openForPublic()));
        });

        it('should be able to change state to operational on transfer', async () => {
            await cc.transferAndCall(marketMaker.address, await cc.totalSupply(), INITIALIZE_ON_TRANSFER_DATA);
            assert(await marketMaker.operational());
            assert(!(await marketMaker.openForPublic()));
        });

        it('should not be able to change state to operational after transfer, non owner', async () => {
            await cc.transfer(marketMaker.address, await cc.totalSupply());
            await expectRevert(marketMaker.initializeAfterTransfer({from: accounts[1]}));
        });

        it('should not be able to change state to operational on transfer. non owner', async () => {
            await expectRevert(cc.transferAndCall(marketMaker.address, await cc.totalSupply(), INITIALIZE_ON_TRANSFER_DATA, {from: accounts[1]}));
        });
    });

    describe('operational', async () => {

        let someExchange = async () => {
            assert.equal(await cc.balanceOf(owner), 0);
            let changeData = encodeChangeData(cc.address);
            await cln.transferAndCall(marketMaker.address, amount, changeData);
            let ccAmount = await cc.balanceOf(owner);
            assert.isAbove(ccAmount, 0);
        }

        beforeEach(async () => {
            await cln.makeTokensTransferable();
            await cc.makeTokensTransferable();
            marketMaker = await EllipseMarketMaker.new(lib.address, cln.address, cc.address);
            marketMaker = IEllipseMarketMaker.at(marketMaker.address);
            assert(!(await marketMaker.operational()));
            assert(!(await marketMaker.openForPublic()));
            await cc.transferAndCall(marketMaker.address, await cc.totalSupply(), INITIALIZE_ON_TRANSFER_DATA);
            assert(await marketMaker.operational());
            assert(!(await marketMaker.openForPublic()));
        });

        it('should be able to get price', async () => {
            await someExchange();
            let price = await marketMaker.getPrice();
            assert(price);
        });

        it('should be able to get price, non owner', async () => {
            await someExchange();
            let price = await marketMaker.getPrice({from: nonOwner});
            assert(price);
        });

        it('should be able to get quote', async () => {
            await someExchange();
            let returnAmount = await marketMaker.quote(cln.address, amount, cc.address);
            assert(returnAmount);
        });

        it('should be able to get quote, non owner', async () => {
            await someExchange();
            let returnAmount = await marketMaker.quote(cln.address, amount, cc.address, {from: nonOwner});
            assert(returnAmount);
        });

        it('should be able to change using approve, owner', async () => {
            assert.equal(await cc.balanceOf(owner), 0);
            await cln.approve(marketMaker.address, amount);
            await marketMaker.change[CHANGE_SIGS.afterApprove](cln.address, amount, cc.address);
            let ccAmount = (await cc.balanceOf(owner)).toNumber();
            assert.isAbove(ccAmount, 0);
        });

        it('should be able to change using 223, owner', async () => {
            assert.equal(await cc.balanceOf(owner), 0);
            let changeData = encodeChangeData(cc.address);
            await cln.transferAndCall(marketMaker.address, amount, changeData);
            let ccAmount = await cc.balanceOf(owner);
            assert.isAbove(ccAmount, 0);
        });

        it('should not be able to change using approve, non owner', async () => {
            await cln.transfer(nonOwner, amount);
            assert.equal(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), amount);
            await cln.approve(marketMaker.address, amount, {from: nonOwner});
            await expectRevert(marketMaker.change[CHANGE_SIGS.afterApprove](cln.address, amount, cc.address, {from: nonOwner}));
            assert.equal(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), amount);
        });

        it('should not be able to change using 223, non owner', async () => {
            await cln.transfer(nonOwner, amount);
            assert.equal(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), amount);
            let changeData = encodeChangeData(cc.address);
            await expectRevert(cln.transferAndCall(marketMaker.address, amount, changeData, {from: nonOwner}));
            assert.equal(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), amount);
        });

        it('should let owner to exchange back his cln fully (returning all the cc)', async () => {
            assert.equal(await cc.balanceOf(owner), 0);
            let amountBefore = (await cln.balanceOf(owner)).toNumber();
            await cln.approve(marketMaker.address, amount);
            await marketMaker.change[CHANGE_SIGS.afterApprove](cln.address, amount, cc.address);
            let ccAmount = new BigNumber(await cc.balanceOf(owner))
            assert.isAbove(ccAmount, 0);
            await cc.approve(marketMaker.address, ccAmount);
            await marketMaker.change[CHANGE_SIGS.afterApprove](cc.address, ccAmount, cln.address);
            assert.equal(amountBefore, (await cln.balanceOf(owner)).toNumber());
        });
    });

    describe('tradable', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            await cc.makeTokensTransferable();
            marketMaker = await EllipseMarketMaker.new(lib.address, cln.address, cc.address);
            marketMaker = IEllipseMarketMaker.at(marketMaker.address);
            assert(!(await marketMaker.operational()));
            assert(!(await marketMaker.openForPublic()));
            await cc.transferAndCall(marketMaker.address, await cc.totalSupply(), INITIALIZE_ON_TRANSFER_DATA);
            assert(await marketMaker.operational());
            assert(!(await marketMaker.openForPublic()));
            let changeData = encodeChangeData(cc.address);
            await cln.transferAndCall(marketMaker.address, amount, changeData);
            let ccAmount = await cc.balanceOf(owner);
            assert.isAbove(ccAmount, 0);
            assert(await marketMaker.openForPublicTrade());
            assert(await marketMaker.operational());
            assert(await marketMaker.openForPublic());
        });

        it('should be able to get price', async () => {
            let price = await marketMaker.getPrice();
            assert(price);
        });

        it('should be able to get price, non owner', async () => {
            let price = await marketMaker.getPrice({from: nonOwner});
            assert(price);
        });

        it('should be able to get quote', async () => {
            let returnAmount = await marketMaker.quote(cln.address, amount, cc.address);
            assert(returnAmount);
        });

        it('should be able to get quote, non owner', async () => {
            let returnAmount = await marketMaker.quote(cln.address, amount, cc.address, {from: nonOwner});
            assert(returnAmount);
        });

        it('should be able to change using approve, owner', async () => {
            let ccBalance = await cc.balanceOf(owner);
            await cln.approve(marketMaker.address, amount);
            await marketMaker.change[CHANGE_SIGS.afterApprove](cln.address, amount, cc.address);
            let ccAmount = (await cc.balanceOf(owner)).toNumber();
            assert.isAbove(ccAmount, ccBalance);
        });

        it('should be able to change using 223, owner', async () => {
            let ccBalance = await cc.balanceOf(owner);
            let changeData = encodeChangeData(cc.address);
            await cln.transferAndCall(marketMaker.address, amount, changeData);
            let ccAmount = await cc.balanceOf(owner);
            assert.isAbove(ccAmount, ccBalance);
        });

        it('should be able to change using approve, non owner', async () => {
            await cln.transfer(nonOwner, amount);
            assert.equal(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), amount);
            await cln.approve(marketMaker.address, amount, {from: nonOwner});
            await marketMaker.change[CHANGE_SIGS.afterApprove](cln.address, amount, cc.address, {from: nonOwner});
            assert.isAbove(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), 0);
        });

        it('should not be able to change using 223, non owner', async () => {
            await cln.transfer(nonOwner, amount);
            assert.equal(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), amount);
            let changeData = encodeChangeData(cc.address);
            await cln.transferAndCall(marketMaker.address, amount, changeData, {from: nonOwner});
            assert.isAbove(await cc.balanceOf(nonOwner), 0);
            assert.equal(await cln.balanceOf(nonOwner), 0);
        });
    });

    let exchanges = [
      {direction: 'CLNToCC', amount: new BigNumber('1000').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('17320.505188937186424494').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('17320.505188937186424494').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('1000').mul(TOKEN_DECIMALS)},
      
      {direction: 'CLNToCC', amount: new BigNumber('1000').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('17320.505188937186424494').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('1000').mul(TOKEN_DECIMALS),  account: 0, expectedReturn: new BigNumber('7174.384073927424452131').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('24494.889262864610876625').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('2000').mul(TOKEN_DECIMALS)},
      
      {direction: 'CLNToCC', amount: new BigNumber('1000').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('17320.505188937186424494').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('17320.505188937186424494').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('1000').mul(TOKEN_DECIMALS)},
      
      {direction: 'CLNToCC', amount: new BigNumber('1000').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('17320.505188937186424494').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('1000').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('7174.384073927424452131').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('24494.889262864610876625').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('2000').mul(TOKEN_DECIMALS)},
      
      {direction: 'CLNToCC', amount: new BigNumber('1651').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('22255.330314778524985127').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('1561').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('223.4816301398964206').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('3258.2156').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('16798.575618847738064768').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('5614.514656').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('18095.43797268071033059').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('415.816516').mul(TOKEN_DECIMALS), account: 3, expectedReturn: new BigNumber('1110.933506662044234647').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('5619.112313').mul(TOKEN_DECIMALS), account: 3, expectedReturn: new BigNumber('13304.483576393424616549').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('1.23165').mul(TOKEN_DECIMALS), account: 3, expectedReturn: new BigNumber('0.5748020844971486').mul(TOKEN_DECIMALS)}, 
      {direction: 'CLNToCC', amount: new BigNumber('0.0002149984').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('0.000460689192331964').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('165.165616').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('353.019525472077923318').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('1651.651').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('3437.356144645127695704').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('816.156162').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('1640.752248647991119975').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('45.651651').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('22.9511499042853454').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('1315.8131').mul(TOKEN_DECIMALS), account: 3, expectedReturn: new BigNumber('2574.101588580957443868').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('0.186146').mul(TOKEN_DECIMALS), account: 3, expectedReturn: new BigNumber('0.358141404395468868').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('16816.8').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('7797.9304827735782416').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('468.441656').mul(TOKEN_DECIMALS), account: 1, expectedReturn: new BigNumber('1138.551730427417934558').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('793.41464').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('327.3524971887102541').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('484.488').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('1170.70040597789127128').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('4685.4568').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('10359.634568977767399037').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('8191.5').mul(TOKEN_DECIMALS), account: 2, expectedReturn: new BigNumber('3764.0553093659576291').mul(TOKEN_DECIMALS)},
      
      {direction: 'CLNToCC', amount: new BigNumber('1499968191.2134971887102541').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('14935170.361080786471342745').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('14938985.002991409490309729').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('1499969791.4016369970938809').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('1499969791.4016369970938809').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('14938985.002991409490309729').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('14938985.002991409490309729').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('1499969791.4016369970938809').mul(TOKEN_DECIMALS)},
      {direction: 'CLNToCC', amount: new BigNumber('1499969791.4016369970938809').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('14938985.002991409490309729').mul(TOKEN_DECIMALS)},
      {direction: 'CCToCLN', amount: new BigNumber('14938985.002991409490309729').mul(TOKEN_DECIMALS), account: 0, expectedReturn: new BigNumber('1499969791.4016369970938809').mul(TOKEN_DECIMALS)},

      {direction: 'CLNToCC', amount: new BigNumber('0'), account: 0, expectedReturn: new BigNumber('233')},
      {direction: 'CLNToCC', amount: new BigNumber('1'), account: 0, expectedReturn: new BigNumber('3')},
      {direction: 'CLNToCC', amount: new BigNumber('10'), account: 0, expectedReturn: new BigNumber('24')},
      {direction: 'CLNToCC', amount: new BigNumber('100'), account: 0, expectedReturn: new BigNumber('246')},
      {direction: 'CLNToCC', amount: new BigNumber('1000'), account: 0, expectedReturn: new BigNumber('2458')},
      {direction: 'CLNToCC', amount: new BigNumber('10000'), account: 0, expectedReturn: new BigNumber('24584')},

      {direction: 'CCToCLN', amount: new BigNumber('0'), account: 0, expectedReturn: new BigNumber('0')},
      {direction: 'CCToCLN', amount: new BigNumber('1'), account: 0, expectedReturn: new BigNumber('0')},
      {direction: 'CCToCLN', amount: new BigNumber('10'), account: 0, expectedReturn: new BigNumber('0')},
      {direction: 'CCToCLN', amount: new BigNumber('100'), account: 0, expectedReturn: new BigNumber('11')},
      {direction: 'CCToCLN', amount: new BigNumber('1000'), account: 0, expectedReturn: new BigNumber('400')},
      {direction: 'CCToCLN', amount: new BigNumber('10000'), account: 0, expectedReturn: new BigNumber('4100')}
    ];

    describe('exchanges', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            await cc.makeTokensTransferable();
            marketMaker = await EllipseMarketMaker.new(lib.address, cln.address, cc.address);
            marketMaker = IEllipseMarketMaker.at(marketMaker.address);
            assert(!(await marketMaker.operational()));
            assert(!(await marketMaker.openForPublic()));
            await cc.transferAndCall(marketMaker.address, await cc.totalSupply(), INITIALIZE_ON_TRANSFER_DATA);
            assert(await marketMaker.openForPublicTrade());
            assert(await marketMaker.operational());
            assert(await marketMaker.openForPublic());
            await cln.transfer(accounts[1], new BigNumber('10000').mul(TOKEN_DECIMALS));
            await cln.transfer(accounts[2], new BigNumber('10000').mul(TOKEN_DECIMALS));
            await cln.transfer(accounts[3], new BigNumber('10000').mul(TOKEN_DECIMALS));
        });

        context('using approve', async () => {
            let maxErr = new BigNumber(1e+0);
            let baseToken;
            let returnToken;
            it('should test verius exchanges', async () => {
                for (let i = 0; i < exchanges.length; i++) {
                    let exchange = exchanges[i];
                    console.log(`\texchanging ${exchange.direction} amount ${exchange.amount}`);
                    baseToken = (exchange.direction == 'CLNToCC') ? cln : cc;
                    returnToken = (exchange.direction == 'CLNToCC') ? cc : cln;

                    let accountBaseBalance = new BigNumber(await baseToken.balanceOf(accounts[exchange.account]));
                    let accountReturnTokenBalance = new BigNumber(await returnToken.balanceOf(accounts[exchange.account]));

                    let returnAmount = new BigNumber(await marketMaker.quote(baseToken.address, exchange.amount, returnToken.address, {from: accounts[exchange.account]}));
                    if (returnAmount.equals(new BigNumber(0))) {
                        if (exchange.expectedReturn.equals(0)) {
                            continue;
                        }
                    }
                    assert.approximately(returnAmount.toNumber(), exchange.expectedReturn.toNumber(), maxErr.toNumber());

                    await baseToken.approve(marketMaker.address, exchange.amount, {from: accounts[exchange.account]});
                    await expectRevert(marketMaker.change[CHANGE_SIGS.afterApproveWithMin](baseToken.address, exchange.amount, returnToken.address, exchange.expectedReturn.add(maxErr), {from: accounts[exchange.account]}));

                    assert.equal(accountBaseBalance, (await baseToken.balanceOf(accounts[exchange.account])).toNumber());
                    assert.equal(accountReturnTokenBalance, (await returnToken.balanceOf(accounts[exchange.account])).toNumber());

                    await marketMaker.change[CHANGE_SIGS.afterApproveWithMin](baseToken.address, exchange.amount, returnToken.address, exchange.expectedReturn.sub(maxErr), {from: accounts[exchange.account]});

                    assert.approximately(accountBaseBalance.sub(exchange.amount).toNumber(), (await baseToken.balanceOf(accounts[exchange.account])).toNumber(), maxErr.toNumber());
                    assert.approximately(accountReturnTokenBalance.add(exchange.expectedReturn).toNumber(), (await returnToken.balanceOf(accounts[exchange.account])).toNumber(), maxErr.toNumber());
                }

            });
        });

        context('using transferAndCall', async () => {
            let maxErr = new BigNumber(1e+0);
            let baseToken;
            let returnToken;
            it('should test verius exchanges', async () => {
                for (let i = 0; i < exchanges.length; i++) {
                    let exchange = exchanges[i];
                    console.log(`\texchanging ${exchange.direction} amount ${exchange.amount}`);
                    baseToken = (exchange.direction == 'CLNToCC') ? cln : cc;
                    returnToken = (exchange.direction == 'CLNToCC') ? cc : cln;

                    let accountBaseBalance = new BigNumber(await baseToken.balanceOf(accounts[exchange.account]));
                    let accountReturnTokenBalance = new BigNumber(await returnToken.balanceOf(accounts[exchange.account]));

                    let returnAmount = new BigNumber(await marketMaker.quote(baseToken.address, exchange.amount, returnToken.address, {from: accounts[exchange.account]}));
                    if (returnAmount.equals(new BigNumber(0))) {
                        if (exchange.expectedReturn.equals(0)) {
                            continue;
                        }
                    }
                    assert.approximately(returnAmount.toNumber(), exchange.expectedReturn.toNumber(), maxErr.toNumber());

                    let changeData = encodeChangeData(returnToken.address, exchange.expectedReturn.add(maxErr));
                    await expectRevert(baseToken.transferAndCall(marketMaker.address, exchange.amount, changeData, {from: accounts[exchange.account]}));

                    assert.equal(accountBaseBalance, (await baseToken.balanceOf(accounts[exchange.account])).toNumber());
                    assert.equal(accountReturnTokenBalance, (await returnToken.balanceOf(accounts[exchange.account])).toNumber());

                    changeData = encodeChangeData(returnToken.address, exchange.expectedReturn.sub(maxErr));
                    await baseToken.transferAndCall(marketMaker.address, exchange.amount, changeData, {from: accounts[exchange.account]});

                    assert.approximately(accountBaseBalance.sub(exchange.amount).toNumber(), (await baseToken.balanceOf(accounts[exchange.account])).toNumber(), maxErr.toNumber());
                    assert.approximately(accountReturnTokenBalance.add(exchange.expectedReturn).toNumber(), (await returnToken.balanceOf(accounts[exchange.account])).toNumber(), maxErr.toNumber());
                }

            });
        });
    });
});

