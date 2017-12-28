const expectRevert = require('./helpers/expectRevert');

const Standard677TokenMock = artifacts.require('Standard677TokenMock');

contract('Standard677Token', (accounts) => {
	let token;

    let initialFunds = 10000;
    let transferredFunds = 1200;

    let owner = accounts[0];
    let spender = accounts[1];
    let to = accounts[2];

    let balanceOwner;
    let balanceSpender;
    let balanceTo;

    beforeEach(async () => {
        token = await Standard677TokenMock.new();

        assert.equal((await token.balanceOf(owner)).toNumber(), 0);

        await token.assign(owner, initialFunds);

        balanceOwner = (await token.balanceOf(owner)).toNumber();
        balanceSpender = (await token.balanceOf(spender)).toNumber();
        balanceTo = (await token.balanceOf(to)).toNumber();
    });

    describe('construction', async () => {
        it('should return correct initial totalSupply after construction', async () => {
            assert.equal((await token.totalSupply()).toNumber(), 0);
        });
    });

    describe('transferAndCall, balanceOf', async () => {
        it('should update balanceOf() after transfer()', async () => {
            await token.transferAndCall(spender, transferredFunds, []);

            assert.equal((await token.balanceOf(owner)).toNumber(), balanceOwner - transferredFunds);
            assert.equal((await token.balanceOf(spender)).toNumber(), transferredFunds);
        });

        it('should not allow transferAndCall() over balanceOf()', async () => {
            await expectRevert(token.transferAndCall(to, initialFunds + 1, []));

            await token.assign(owner, 0);
            await expectRevert(token.transferAndCall(to, 1, []));
        });
    });

    describe('events', async () => {
        it('should log Transfer event after transferAndCall()', async () => {
            let result = await token.transferAndCall(spender, transferredFunds, []);

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