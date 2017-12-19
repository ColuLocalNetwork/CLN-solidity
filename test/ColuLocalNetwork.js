const expectRevert = require('./helpers/expectRevert');

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');

const TOKEN_DECIMALS = 10 ** 18;

const MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS;

contract('ColuLocalNetwork', (accounts) => {
    let token;

    let owner = accounts[0];
    let spender = accounts[1];
    let to1 = accounts[2];
    let to2 = accounts[3];
    let to3 = accounts[4];

    let allowedAmount = 100;  // Spender allowance
    let transferredFunds = 1200;  // Funds to be transferred around in tests

    let ownerAmount;

    beforeEach(async () => {
        token = await ColuLocalNetwork.new(MAX_TOKENS);
        ownerAmount = MAX_TOKENS;
    });

    describe('construction', async () => {
        it('should be ownable', async () => {
            assert.equal(await token.owner(), owner);
        });

        it('should return correct name after construction', async () => {
            assert.equal(await token.name(), 'Colu Local Network');
        });

        it('should return correct symbol after construction', async () => {
            assert.equal(await token.symbol(), 'CLN');
        });

        it('should return correct decimal points after construction', async () => {
            assert.equal(await token.decimals(), 18);
        });

        it('should have isTransferable mode turned off', async () => {
            assert.isFalse(await token.isTransferable());
        });
    });

    describe('transfer', async () => {


        it('should update balances correctly after transfer', async () => {
            assert.equal((await token.balanceOf(owner)).toNumber(), ownerAmount);

            await token.transfer(to1, transferredFunds)
            ownerAmount-=transferredFunds;

            // Checking owner balance reduced after every owner transfer
            assert.equal((await token.balanceOf(owner)).toNumber(), ownerAmount);
            assert.equal((await token.balanceOf(to1)).toNumber(), transferredFunds);

            await token.transfer(to2, transferredFunds)
            ownerAmount-=transferredFunds;
            assert.equal((await token.balanceOf(to2)).toNumber(), transferredFunds);

            await token.transfer(to3, transferredFunds)
            ownerAmount-=transferredFunds;
            assert.equal((await token.balanceOf(to3)).toNumber(), transferredFunds);

            assert.equal((await token.balanceOf(owner)).toNumber(), ownerAmount);
        });

        it('should not change totalSupply after transfer', async () => {
            assert.equal((await token.totalSupply()).toNumber(), MAX_TOKENS);

            await token.transfer(to1, transferredFunds);
            assert.equal((await token.totalSupply()).toNumber(), MAX_TOKENS);

            await token.transfer(to1, transferredFunds);
            assert.equal((await token.totalSupply()).toNumber(), MAX_TOKENS);

            await token.transfer(to2, transferredFunds);
            assert.equal((await token.totalSupply()).toNumber(), MAX_TOKENS);
        });

        it('should start transferable mode', async () => {
            await token.makeTokensTransferable();
            assert(await token.isTransferable());
        });

        it('should allow to start transferable mode more than once', async () => {
            await token.makeTokensTransferable();
            await token.makeTokensTransferable();
            await token.makeTokensTransferable();
        });


        it('should not allow approve() before start transferable mode', async () => {
            await expectRevert(token.approve(spender, allowedAmount, {from: spender}));
        });

        it('should allow approve() after start transferable mode', async () => {
            await token.makeTokensTransferable();
            await token.approve(spender, allowedAmount)
        });

        it('should not allow transfer() before start transferable mode', async () => {
            await expectRevert(token.transfer(spender, allowedAmount, {from: spender}));
        });

        it('should not allow transferFrom() before start transferable mode', async () => {
            await expectRevert(token.transferFrom(owner, to1, allowedAmount, {from: spender}));
        });

        it('should allow transferFrom() after start transferable mode', async () => {
            await token.transfer(owner, transferredFunds);
            await token.makeTokensTransferable();
            await token.approve(spender, allowedAmount)
            await token.transferFrom(owner, to1, allowedAmount, {from: spender})
        });
    });

    describe('events', async () => {
        it('should log normal transfer event on transfer', async () => {
            let result = await token.transfer(to1, transferredFunds);

            assert.lengthOf(result.logs, 2);
            let event = result.logs[0];
            assert.equal(event.event, 'Transfer');
            assert.equal(event.args.from, owner);
            assert.equal(event.args.to, to1);
            assert.equal(Number(event.args.value), transferredFunds);
        });

        it('should log TokensTransferable event after start transferable mode', async () => {
            let result = await token.makeTokensTransferable();
            assert.lengthOf(result.logs, 1);
            assert.equal(result.logs[0].event, 'TokensTransferable');

            // Additional calls should not emit events.
            result = await token.makeTokensTransferable();
            assert.equal(result.logs.length, 0);
            result = await token.makeTokensTransferable();
            assert.equal(result.logs.length, 0);
        });
    });
});