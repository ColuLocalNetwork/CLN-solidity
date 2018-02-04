const expectRevert = require('./helpers/expectRevert');
const coder = require('web3-eth-abi');
const expect = require('chai').expect;
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');
const EllipseMarketMaker = artifacts.require('EllipseMarketMaker');
const CurrencyFactory = artifacts.require('CurrencyFactory');
const ColuLocalCurrency = artifacts.require('ColuLocalCurrency');
const EllipseMarketMakerLib =  artifacts.require('EllipseMarketMakerLib');

const TOKEN_DECIMALS = 10 ** 18;

const THOUSAND_CLN = 1000 * TOKEN_DECIMALS;

const CLN_MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS;
const CC_MAX_TOKENS = 15 * 10 ** 6 * TOKEN_DECIMALS;

const STRUCT_SIZE = 5;

const INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI = {
    name: 'insertCLNtoMarketMaker',
    type: 'function',
    inputs: [{
        type: 'address',
        name: 'token'
    }],
    outputs: [
        {
            type: 'bool',
            name: 'success'
        }
    ]
}

const EXTRACT_FROM_MM_AND_TRANSFER_WITH_MIN_ABI = {
    name: 'extractCLNfromMarketMaker',
    type: 'function',
    inputs: []
}

const encodeData = (toToken) => {
    let abi, params;
    if (toToken) {
        abi = INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI;
        //console.log('encoding INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI')
        params = [toToken];
    } else {
        abi = EXTRACT_FROM_MM_AND_TRANSFER_WITH_MIN_ABI;
        //params = [toToken];
    }
    return coder.encodeFunctionCall(abi, params);
};

contract('CurrencyFactory', (accounts) => {
    let cln;

    let Factory;
    let mmAdress;
    let mmlib;

    let factoryOwner = accounts[2]
    let owner = accounts[0];
    let notOwner = accounts[1];

    let amount = 50 * TOKEN_DECIMALS;
    let tokenAddress;

    before(async () => {
        mmlib = await EllipseMarketMakerLib.new();
    });

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        await cln.makeTokensTransferable();
        await cln.transfer(notOwner, THOUSAND_CLN * 1000);
    });

    describe('construction', async () => {
        it('should not construct with no address to CLN contract', async () => {
            await expectRevert(CurrencyFactory.new(mmlib.address, null,  {from: owner} ));
        });

        it('should not construct with not transfarable token', async () => {
          await expectRevert(CurrencyFactory.new(mmlib.address, cln.address,  {from: owner} ));
        });

        it('should construct with correct pramms', async () => {
            await cln.makeTokensTransferable();
            // TODO: Factory -> factory
            Factory = await CurrencyFactory.new(mmlib.address, cln.address,  {from: owner} )
            assert.equal((await Factory.clnAddress()) ,cln.address);
            assert.equal((await Factory.mmLibAddress()) ,mmlib.address);
         });
    });

    describe('creating Local Currency and its MarketMaker', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            Factory = await CurrencyFactory.new(mmlib.address, cln.address,  {from: factoryOwner} )
        });

        it('should not be able to create without name', async () => {
            await expectRevert(Factory.createCurrency('', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create without symbol', async () => {
            await expectRevert(Factory.createCurrency('Some Name', '', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with zero decimals', async () => {
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 0, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create with zero supply', async () => {
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 18, 0, {from: owner}));
        });

        it('should not be able to create when 10 ** decimals > total supply', async () => {
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 18, 1, {from: owner}));
        });

        it('should be able to create with correct parameters', async () => {
            let result = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});
            // assert.equal(result.owner, owner);
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token;

            var currencyStruct = await Factory.currencyMap(tokenAddress);
            // check the currency owner
            assert.equal(currencyStruct[3], owner);
        });

        it('should not be able to create two tokens with same name', async () => {
            assert(await Factory.createCurrency('Some Name', 'SON1', 18, CC_MAX_TOKENS, {from: owner}));
            await expectRevert(Factory.createCurrency('Some Name', 'SON2', 18, CC_MAX_TOKENS, {from: owner}));
        });

        it('should not be able to create two tokens with same symbol', async () => {
            assert(await Factory.createCurrency('Some Name1', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
            await expectRevert(Factory.createCurrency('Some Name2', 'SON', 18, CC_MAX_TOKENS, {from: owner}));
        });
    });

    describe('Interact with MarketMaker through factory before opening market', async () => {

        beforeEach(async () => {
            Factory = await CurrencyFactory.new(mmlib.address, cln.address,  {from: factoryOwner} )
            assert.equal(await Factory.clnAddress() ,cln.address);
            let result = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token;
            assert(expect(tokenAddress).to.be.a('String'));
        });

        it('should not be able to insert 0 CLN', async () => {
            await expectRevert(Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, 0, {from: owner}));
        });

        it('should not be able to insert CLN if no allowance was given', async () => {
            await expectRevert(Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
        });

        it('should not be able to insert CLN if not owner', async () => {
            await cln.approve(Factory.address, THOUSAND_CLN, {from: notOwner});
            await expectRevert(Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}));
        });

        it('should be able to insert CLN if owner (approve, transfer)', async () => {
            let balanceBefore = BigNumber(await cln.balanceOf(owner));
            await cln.approve(Factory.address, THOUSAND_CLN, {from: owner});
            assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}))
            let balanceNow = BigNumber(await cln.balanceOf(owner));
            assert(balanceBefore.minus(balanceNow).eq(THOUSAND_CLN));
            const cc = await ColuLocalCurrency.at(tokenAddress);
            let cc1Balance = BigNumber(await cc.balanceOf(owner));

            assert.notEqual(BigNumber(cc1Balance.toNumber(), 0));
            // Gives correct number of CC tokens
            assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

            // inserting second time
            balanceBefore = balanceNow
            await cln.approve(Factory.address, 2 * THOUSAND_CLN, {from: owner});
            assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, 2 * THOUSAND_CLN, {from: owner}))
            balanceNow = BigNumber(await cln.balanceOf(owner));
            assert(balanceBefore.minus(balanceNow).eq(2 * THOUSAND_CLN));
            cc1Balance = BigNumber(await cc.balanceOf(owner));
            assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 30000);
        });

        it('should not be able to extract CLN if not owner', async () => {
            // Sending thousand CLN to contract
            await cln.approve(Factory.address, THOUSAND_CLN, {from: owner});
            assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));

            // aproving and try to extract tokens
            await cln.approve(Factory.address, THOUSAND_CLN, {from: owner});
            await expectRevert(Factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, TOKEN_DECIMALS, {from: notOwner}));
        });

        it('should be able to insert CC if owner and get back CLN', async () => {
            var clnvalue = BigNumber(await cln.balanceOf(owner));
            await cln.approve(Factory.address, 2 * THOUSAND_CLN, {from: owner})
            assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, 2 * THOUSAND_CLN, {from: owner}))

            // CLN ammount decreased by 1000
            assert(BigNumber(await cln.balanceOf(owner)).eq(clnvalue - (2 * THOUSAND_CLN)));

            var ccadder = await Factory.currencyMap(tokenAddress);
            cc = await ColuLocalCurrency.at(tokenAddress);
            mm = await EllipseMarketMaker.at(ccadder[STRUCT_SIZE - 1]);
            var ccvalue = BigNumber(await cc.balanceOf(owner));
            assert.notEqual(ccvalue, 0);
            await cc.approve(Factory.address, ccvalue, {from: owner});

            // extract all CC tokens in two operations
            assert(await Factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, ccvalue / 2, {from: owner}));
            // ccvalue = BigNumber(await cc.balanceOf(owner));
            assert(await Factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, await cc.balanceOf(owner), {from: owner}));

            var newclnValue = BigNumber(await cln.balanceOf(owner));
            // CLN value does not changed
            assert(newclnValue.eq(clnvalue));
            assert((await cc.balanceOf(owner)).eq(0));
        });

        it('should not be able to insert CC if not owner and get back CLN', async () => {
            var clnvalue = BigNumber(await cln.balanceOf(owner));
            await cln.approve(Factory.address, THOUSAND_CLN, {from: owner});
            assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            var ccadder = await Factory.currencyMap(tokenAddress);
            cc = await ColuLocalCurrency.at(tokenAddress);
            mm = await EllipseMarketMaker.at(ccadder[STRUCT_SIZE -1]);
            var ccvalue = BigNumber(await cc.balanceOf(owner));
            assert.notEqual(ccvalue, 0);
            await cc.transfer(notOwner, ccvalue, {from: owner});
            await cc.approve(Factory.address, ccvalue, {from: notOwner});
            await expectRevert(Factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, ccvalue, {from: notOwner}));
            assert.equal(ccvalue.toNumber(), (await cc.balanceOf(notOwner)).toNumber());
        });

        it('should not be able to insert CLN if not owner (transferAndCall)', async () => {
            let changeData = encodeData(mmlib.address);
            await expectRevert(cln.transferAndCall(Factory.address, THOUSAND_CLN, changeData));
        });

        it('should be able to insert CLN if owner (transferAndCall)', async () => {
            let changeData = encodeData(tokenAddress);
            await cln.transferAndCall(Factory.address, THOUSAND_CLN, changeData);
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.notEqual(BigNumber(await cc.balanceOf(owner)).toNumber(), 0);
        });

        it('should not be able to open market if not owner', async () => {
            await expectRevert(Factory.openMarket(tokenAddress, {from: notOwner}));
        });

        it('should be able to open market if owner', async () => {
            let result = await Factory.openMarket(tokenAddress, {from: owner});
            let event = result.logs[1];
            assert.equal(event.event, 'MarketOpen');
            const marketMakerAddress = await Factory.getMarketMakerAddressFromToken(tokenAddress);
            const marketMaker = await EllipseMarketMaker.at(marketMakerAddress);
            assert(marketMaker.owner, owner);
        });

        describe('Miscellaneous methods', async () => {
            it('should support CLN token', async () => {
                assert(await Factory.supportsToken(cln.address));
            });

            it('should support CC token', async () => {
                assert(await Factory.supportsToken(tokenAddress));
            });

            it('should not support other contracts', async () => {
                assert.isNotOk(await Factory.supportsToken(mmlib.address));
            });
        });
    });


    describe('Create two different currencies one after another', async () => {
      let tokenAddress1;
      let tokenAddress2;

      let owner1 = accounts[0];
      let owner2 = accounts[1];

      beforeEach(async () => {
          Factory = await CurrencyFactory.new(mmlib.address, cln.address,  {from: factoryOwner} )
          let result = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner1});
          let event = result.logs[0];
          tokenAddress1 = event.args.token;

          result = await Factory.createCurrency('Other Name', 'ON', 18, CC_MAX_TOKENS, {from: owner2});
          event = result.logs[0];
          tokenAddress2 = event.args.token;
      });

      it('should be able to insert CLN into multiple currencies one after another', async () => {
          // insert to first currency
          const balanceBefore = BigNumber(await cln.balanceOf(owner1));
          await cln.approve(Factory.address, THOUSAND_CLN, {from: owner1});
          assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress1, THOUSAND_CLN, {from: owner1}))
          const balanceNow = BigNumber(await cln.balanceOf(owner1));
          assert(balanceBefore.minus(balanceNow).eq(THOUSAND_CLN));
          const cc1 = await ColuLocalCurrency.at(tokenAddress1);
          const cc1Balance = BigNumber(await cc1.balanceOf(owner1))
          assert.notEqual(cc1Balance.toNumber(), 0);
          assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

          // insert to second currency
          const balanceBefore2 = BigNumber(await cln.balanceOf(owner2));
          await cln.approve(Factory.address, 2 * THOUSAND_CLN, {from: owner2});
          assert(await Factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress2, 2 * THOUSAND_CLN, {from: owner2}))
          const balanceNow2 = BigNumber(await cln.balanceOf(owner2));
          assert(balanceBefore2.minus(balanceNow2).eq(2 * THOUSAND_CLN));
          const cc2 = await ColuLocalCurrency.at(tokenAddress2);
          const cc2Balance = BigNumber(await cc2.balanceOf(owner2));
          assert.notEqual(cc2Balance.toNumber(), 0);
          assert.equal(cc2Balance.div(TOKEN_DECIMALS).toFixed(0), 24495);


          // check CC1 doesn't effect CC2
          assert(balanceNow.eq(await cln.balanceOf(owner1)));
          assert(balanceNow2.eq(await cln.balanceOf(owner2)));
          assert(cc1Balance.eq(await cc1.balanceOf(owner1)));
          assert(cc2Balance.eq(await cc2.balanceOf(owner2)));
      });

    });
});
