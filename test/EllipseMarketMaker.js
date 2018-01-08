const expectRevert = require('./helpers/expectRevert');
const coder = require('web3-eth-abi');

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');
const EllipseMarketMaker = artifacts.require('EllipseMarketMaker');

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

    let marketMaker;

    let owner = accounts[0];
    let nonOwner = accounts[1];

    let amount = 50 * TOKEN_DECIMALS;

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        cc = await ColuLocalNetwork.new(CC_MAX_TOKENS);
    });

    describe('construction', async () => {
        it('should not constract with token1 null', async () => {
            await expectRevert(EllipseMarketMaker.new(null, cc.address, {from: accounts[0]}));
        });
        
        it('should not constract with token1 0', async () => {
            await expectRevert(EllipseMarketMaker.new(0, cc.address, {from: accounts[0]}));
        });
        
        it('should not constract with token2 null', async () => {
            await expectRevert(EllipseMarketMaker.new(cln.address, null, {from: accounts[0]}));
        });
        
        it('should not constract with token2 0', async () => {
            await expectRevert(EllipseMarketMaker.new(cln.address, 0, {from: accounts[0]}));
        });
        
        it('should not constract same token', async () => {
            await expectRevert(EllipseMarketMaker.new(cc.address, cc.address, {from: accounts[0]}));
        });

        it('should constract with in non operational mode', async () => {
            marketMaker = await EllipseMarketMaker.new(cln.address, cc.address);
            assert(!(await marketMaker.operational()));
            assert(await marketMaker.bootstrap());
        });
    });

    describe('going operational', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            await cc.makeTokensTransferable();
            marketMaker = await EllipseMarketMaker.new(cln.address, cc.address);
            assert(!(await marketMaker.operational()));
            assert(await marketMaker.bootstrap());
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
            assert(await marketMaker.bootstrap());
        });

        it('should be able to change state to operational on transfer', async () => {
            await cc.transferAndCall(marketMaker.address, await cc.totalSupply(), INITIALIZE_ON_TRANSFER_DATA);
            assert(await marketMaker.operational());
            assert(await marketMaker.bootstrap());
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
            marketMaker = await EllipseMarketMaker.new(cln.address, cc.address);
            assert(!(await marketMaker.operational()));
            assert(await marketMaker.bootstrap());
            await cc.transferAndCall(marketMaker.address, await cc.totalSupply(), INITIALIZE_ON_TRANSFER_DATA);
            assert(await marketMaker.operational());
            assert(await marketMaker.bootstrap());
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
            let ccAmount = await cc.balanceOf(owner);
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
    });
});