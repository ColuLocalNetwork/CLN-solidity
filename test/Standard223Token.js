const expectRevert = require('./helpers/expectRevert');

const Standard223TokenMock = artifacts.require('Standard223TokenMock');
const Standard223ReceiverMock = artifacts.require('Standard223ReceiverMock');

const tokenTransferWithDataSig = 'address,uint256,bytes';

contract('Standard223Token', (accounts) => {
	let token223;
    let receiver;

    let initialFunds = 10000;  // Initial owner funds
    let transferredFunds = 1200;  // Funds to be transferred around in tests
    let allowedAmount = 100;  // Spender allowance

    let owner = accounts[0];
    let spender = accounts[1];
    let to = accounts[2];

    // These need to be reset before every test
    // in a beforeEach() clause
    let balanceOwner;
    let balanceSpender;
    let balanceTo;

    beforeEach(async () => {
        token223 = await Standard223TokenMock.new();
        receiver = await Standard223ReceiverMock.new();

        // Should return 0 balance for owner account
        assert.equal((await token223.balanceOf(owner)).toNumber(), 0);

        // Assign tokens to account[0] ('owner')
        await token223.assign(owner, initialFunds);

        balanceOwner = (await token223.balanceOf(owner)).toNumber();
        balanceSpender = (await token223.balanceOf(spender)).toNumber();
        balanceTo = (await token223.balanceOf(to)).toNumber();
    });

    describe('construction', async () => {
        it('should return correct initial totalSupply after construction', async () => {
            assert.equal((await token223.totalSupply()).toNumber(), 0);
        });
    });

    // Tests involving simple transfer() of funds
    // and fetching balanceOf() accounts
    describe('transfer, balanceOf', async () => {
        it('should update balanceOf() after transfer()', async () => {
            await token223.transfer(spender, transferredFunds);

            assert.equal((await token223.balanceOf(owner)).toNumber(), balanceOwner - transferredFunds);
            assert.equal((await token223.balanceOf(spender)).toNumber(), transferredFunds);
        });

        it('should not allow transfer() over balanceOf()', async () => {
            await expectRevert(token223.transfer(to, initialFunds + 1));

            await token223.assign(owner, 0);
            await expectRevert(token223.transfer(to, 1));
        });

        it('should call tokenFallback() after transfer() to contract address', async () => {
            await token223.transfer(receiver.address, transferredFunds);

            assert.equal((await receiver.calledFallback()), true);
            assert.equal((await receiver.tokenValue()).toNumber(), transferredFunds);
            assert.equal((await token223.balanceOf(receiver.address)).toNumber(), transferredFunds);

        });

        it('should not call tokenFallback() after transfer() to non-contract address', async () => {
            await token223.transfer(spender, transferredFunds);

            assert.equal((await receiver.calledFallback()), false);
            assert.equal((await receiver.tokenValue()).toNumber(), 0);
            assert.equal((await token223.balanceOf(spender)).toNumber(), transferredFunds);
        });
    });

    // Tests involving transferring money from A to B via
    // a third account C, which is the one actually making the transfer,
    // using transferFrom()
    describe('approve, allowance, transferFrom', async () => {
        it('should not allow transfer() without approval', async () => {
            await expectRevert(token223.transferFrom(owner, spender, 1, {from: spender}));
        });

        it('should not allow approve() without resetting spender allowance to 0', async () => {
            await token223.approve(spender, allowedAmount);
            await expectRevert(token223.approve(spender, allowedAmount));
            await expectRevert(token223.approve(spender, allowedAmount + 1));
        });

        it('should allow approve() multiple times only after resetting spender allowance to 0 in between', async () => {
            await token223.approve(spender, allowedAmount);

            await token223.approve(spender, 0);
            await token223.approve(spender, allowedAmount + 1);
            assert.equal((await token223.allowance(owner, spender)).toNumber(), allowedAmount + 1);

            await token223.approve(spender, 0);
            await token223.approve(spender, allowedAmount - 1);
            assert.equal((await token223.allowance(owner, spender)).toNumber(), allowedAmount - 1);

            await token223.approve(spender, 0);
            await token223.approve(spender, allowedAmount + 1);
            assert.equal((await token223.allowance(owner, spender)).toNumber(), allowedAmount + 1);
        });

        it('should return correct allowance() amount after approve()', async () => {
            await token223.approve(spender, allowedAmount);
            assert.equal((await token223.allowance(owner, spender)).toNumber(), allowedAmount);
        });

        it('should not allow transfer() over approve() amount', async () => {
            await token223.approve(spender, allowedAmount - 1);

            let spenderAllowance = (await token223.allowance(owner, spender)).toNumber();

            await expectRevert(token223.transferFrom(owner, to, allowedAmount, {from: spender}));

            // test balances are unchanged
            assert.equal((await token223.balanceOf(owner)).toNumber(), balanceOwner);
            assert.equal((await token223.balanceOf(spender)).toNumber(), balanceSpender);
            assert.equal((await token223.balanceOf(to)).toNumber(), balanceTo);

            // test allowance is unchanged
            assert.equal((await token223.allowance(owner, spender)).toNumber(), spenderAllowance);
        });

        it('should update balanceOf() after transferFrom()', async () => {
            await token223.approve(spender, allowedAmount);
            await token223.transferFrom(owner, to, allowedAmount / 2, {from: spender});

            assert.equal((await token223.balanceOf(owner)).toNumber(), balanceOwner - allowedAmount / 2);
            assert.equal((await token223.balanceOf(spender)).toNumber(), balanceSpender);
            assert.equal((await token223.balanceOf(to)).toNumber(), balanceTo + allowedAmount / 2);
        });

        it('should reduce transfer() amount from allowance()', async () => {
            await token223.approve(spender, allowedAmount);

            let spenderAllowance = (await token223.allowance(owner, spender)).toNumber();

            await token223.transferFrom(owner, to, allowedAmount / 2, {from: spender});

            assert.equal((await token223.allowance(owner, spender)).toNumber(), spenderAllowance / 2);
        });
    });

    describe('events', async () => {
        it('should log Transfer event after transfer()', async () => {
            let result = await token223.transfer(spender, transferredFunds);

            assert.lengthOf(result.logs, 2);

            let event1 = result.logs[0];
            assert.equal(event1.event, 'Transfer');
            assert.equal(event1.args.from, owner);
            assert.equal(event1.args.to, spender);
            assert.equal(Number(event1.args.value), transferredFunds);

            let event2 = result.logs[1];
            assert.equal(event2.event, 'Transfer');
            assert.equal(event2.args.from, owner);
            assert.equal(event2.args.to, spender);
            assert.equal(Number(event2.args.value), transferredFunds);
        });

        it('should log Transfer event after transferFrom()', async () => {
            await token223.approve(spender, allowedAmount);

            let value = allowedAmount / 2;
            let result = await token223.transferFrom(owner, to, value, {from: spender});

            assert.lengthOf(result.logs, 2);

            let event1 = result.logs[0];
            assert.equal(event1.event, 'Transfer');
            assert.equal(event1.args.from, owner);
            assert.equal(event1.args.to, to);
            assert.equal(Number(event1.args.value), value);

            let event2 = result.logs[1];
            assert.equal(event2.event, 'Transfer');
            assert.equal(event2.args.from, owner);
            assert.equal(event2.args.to, to);
            assert.equal(Number(event2.args.value), value);
        });

        it('should log Approve event after approve()', async () => {
            let result = await token223.approve(spender, allowedAmount);

            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'Approval');
            assert.equal(event.args.spender, spender);
            assert.equal(Number(event.args.value), allowedAmount);
        });

    });
});