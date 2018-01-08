const expectRevert = require('./helpers/expectRevert');

const Standard677TokenMock = artifacts.require('Standard677TokenMock');
const Standard223ReceiverMock = artifacts.require('Standard223ReceiverMock');

contract('Standard677Token', (accounts) => {
    let token677;
    let receiver;

    let initialFunds = 10000;
    let transferredFunds = 1200;

    let owner = accounts[0];
    let spender = accounts[1];
    let to = accounts[2];

    let balanceOwner;
    let balanceSpender;
    let balanceTo;

    beforeEach(async () => {
        token677 = await Standard677TokenMock.new();
        receiver = await Standard223ReceiverMock.new();

        assert.equal((await token677.balanceOf(owner)).toNumber(), 0);

        await token677.assign(owner, initialFunds);

        balanceOwner = (await token677.balanceOf(owner)).toNumber();
        balanceSpender = (await token677.balanceOf(spender)).toNumber();
        balanceTo = (await token677.balanceOf(to)).toNumber();
    });

    describe('construction', async () => {
        it('should return correct initial totalSupply after construction', async () => {
            assert.equal((await token677.totalSupply()).toNumber(), 0);
        });
    });

    describe('transferAndCall', async () => {
        it('should update balanceOf() after transferAndCall()', async () => {
            await token677.transferAndCall(spender, transferredFunds, []);

            assert.equal((await token677.balanceOf(owner)).toNumber(), balanceOwner - transferredFunds);
            assert.equal((await token677.balanceOf(spender)).toNumber(), transferredFunds);
        });

        it('should not allow transferAndCall() over balanceOf()', async () => {
            await expectRevert(token677.transferAndCall(to, initialFunds + 1, []));

            await token677.assign(owner, 0);
            await expectRevert(token677.transferAndCall(to, 1, []));
        });

        it('should call tokenFallback() after transferAndCall() to contract address', async () => {
            await token677.transferAndCall(receiver.address, transferredFunds, []);

            assert.equal((await receiver.calledFallback()), true);
            assert.equal((await receiver.tokenValue()).toNumber(), transferredFunds);
            assert.equal((await token677.balanceOf(receiver.address)).toNumber(), transferredFunds);
        });

        it('should not call tokenFallback() after transferAndCall() to non-contract address', async () => {
            await token677.transferAndCall(spender, transferredFunds, []);

            assert.equal((await receiver.calledFallback()), false);
            assert.equal((await receiver.tokenValue()).toNumber(), 0);
            assert.equal((await token677.balanceOf(spender)).toNumber(), transferredFunds);
        });
    });

    describe('events', async () => {
        it('should log events after transferAndCall()', async () => {
            let result = await token677.transferAndCall(spender, transferredFunds, []);

            assert.lengthOf(result.logs, 2);

            let event1 = result.logs[0];
            assert.equal(event1.event, 'Transfer');
            assert.equal(event1.args.from, owner);
            assert.equal(event1.args.to, spender);
            assert.equal(Number(event1.args.value), transferredFunds);

            let event2 = result.logs[1];
            assert.equal(event2.event, 'TransferAndCall');
            assert.equal(event2.args.from, owner);
            assert.equal(event2.args.to, spender);
            assert.equal(Number(event2.args.value), transferredFunds);
        });
    });
});