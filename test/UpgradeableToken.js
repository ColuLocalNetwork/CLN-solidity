const expectRevert = require('./helpers/expectRevert');

const UpgradeableTokenMock = artifacts.require('UpgradeableTokenMock');
const UpgradeAgentMock = artifacts.require('UpgradeAgentMock');

contract('UpgradeableToken', (accounts) => {
    let token;

    let upgradeAgent;

    let UpgradeState = {
        Unknown: 0,
        NotAllowed: 1,
        WaitingForAgent: 2,
        ReadyToUpgrade: 3,
        Upgrading: 4
    };

    let initialSupply = 10000;  // Initial supply
    let amountUpgraded = 100;

    let regularUser = accounts[1];

    // These need to be reset before every test
    // in a beforeEach() clause
    let balanceOwner;
    let balanceRegularUser;

    beforeEach(async () => {
        token = await UpgradeableTokenMock.new();

        // Should return 0 balance for regularUser account
        assert.equal((await token.balanceOf(regularUser)).toNumber(), 0);

        // Assign tokens to account[1] ('regularUser')
        await token.assign(regularUser, initialSupply);

        balanceRegularUser = (await token.balanceOf(regularUser)).toNumber();

        assert.equal((await token.totalSupply()).toNumber(), initialSupply);
    });

    describe('construction', async () => {
        it('should return correct initial UpgradeState after construction', async () => {
            assert.equal(await token.getUpgradeState(), UpgradeState.WaitingForAgent);
        });
    })

    describe('setUpgradeAgent', async () => {

        it('should not allow to set agent from non owner account', async () => {
            upgradeAgent = await UpgradeAgentMock.new(token.address, initialSupply);
            await expectRevert(token.setUpgradeAgent(upgradeAgent.address, {from: accounts[1]}));
        })

        it('should not allow to set a 0 agent', async () => {
            await expectRevert(token.setUpgradeAgent(0));
        })

        it('should not allow to set a non-supporting agent', async () => {
            let token2 = await UpgradeableTokenMock.new();
            await expectRevert(token.setUpgradeAgent(token2.address));
        })

        it('should not allow to set an agent with deferent original supply', async () => {
            upgradeAgent = await UpgradeAgentMock.new(token.address, initialSupply - 1);
            await expectRevert(token.setUpgradeAgent(upgradeAgent.address));
        })

        it('should not allow to upgrade token without an agent setup', async () => {
            await expectRevert(token.upgrade(amountUpgraded, {from: regularUser}));
        })

        it('should set upgrade agent properly', async () => {
            upgradeAgent = await UpgradeAgentMock.new(token.address, initialSupply);
            let result = await token.setUpgradeAgent(upgradeAgent.address);
            assert.equal(await token.getUpgradeState(), UpgradeState.ReadyToUpgrade);

            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'UpgradeAgentSet');
            assert.equal(event.args.agent, upgradeAgent.address);
        })
    })

    describe('upgrade', async () => {
        beforeEach(async () => {
            upgradeAgent = await UpgradeAgentMock.new(token.address, initialSupply);
            await token.setUpgradeAgent(upgradeAgent.address);
            assert.equal(await token.getUpgradeState(), UpgradeState.ReadyToUpgrade);
        })

        it('should not fake upgrade (by calling from the owner)', async () => {
            await expectRevert(upgradeAgent.upgradeFrom(regularUser, 10));
        })

        it('should not fake upgrade (by calling from regularUser)', async () => {
            await expectRevert(upgradeAgent.upgradeFrom(regularUser, 10), {from: regularUser});
        })

        it('should not allow upgrade 0 amount', async () => {
            await expectRevert(token.upgrade(0));
        })

        it('should not allow upgrade more than the user balance', async () => {
            await expectRevert(token.upgrade(initialSupply + 1, {from: regularUser}));
        })

        it('should upgrade', async () => {
            let result = await token.upgrade(amountUpgraded, {from: regularUser});
            assert.equal(await token.balanceOf(regularUser), initialSupply - amountUpgraded);
            assert.equal(await token.totalSupply(), initialSupply - amountUpgraded);
            assert.equal(await token.totalUpgraded(), amountUpgraded);

            assert.equal(await upgradeAgent.balanceOf(regularUser), amountUpgraded);

            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'Upgrade');
            assert.equal(event.args.from, regularUser);
            assert.equal(event.args.to, upgradeAgent.address);
            assert.equal(event.args.value, amountUpgraded);
        })

        it('should not allow to replace agent after upgrade started', async () => {
            await token.upgrade(amountUpgraded, {from: regularUser});
            totalSupply = await token.totalSupply();
            let upgradeAgent2 = await UpgradeAgentMock.new(token.address, totalSupply);
            await expectRevert(token.setUpgradeAgent(upgradeAgent.address));
        })
    })
});