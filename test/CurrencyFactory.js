const expectRevert = require('./helpers/expectRevert');
const coder = require('web3-eth-abi');
const expect = require('chai').expect;
const assert = require('chai').assert;

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
    inputs: [],
    outputs: []
}

const encodeInsertData = (toToken) => {
    const abi = INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI;
    const params = [toToken];
    return coder.encodeFunctionCall(abi, params);
};

const encodeExtractData = () => {
    const abi = EXTRACT_FROM_MM_AND_TRANSFER_WITH_MIN_ABI;
    return coder.encodeFunctionCall(abi);
};

const CREATE_CURRENCY_SIGS = {
    full: 'string,string,uint8,uint256,string',
    withoutMetadata: 'string,string,uint8,uint256'
};

const createAndValidateCurrency = async (factory, name, symbol, ownerAddress) => {
  let result = await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON', 18, CC_MAX_TOKENS, '', {from: ownerAddress});
  assert.lengthOf(result.logs, 1);
  let event = result.logs[0];
  assert.equal(event.event, 'TokenCreated');
  const tokenAddress = event.args.token;
  assert(expect(tokenAddress).to.be.a('String'));
  return tokenAddress;
}

contract('CurrencyFactory', (accounts) => {
    let cln;

    let factory;
    let mmAdress;
    let mmLib;

    let factoryOwner = accounts[2]
    let owner = accounts[0];
    let notOwner = accounts[1];

    let amount = 50 * TOKEN_DECIMALS;
    let tokenAddress;

    before(async () => {
        mmLib = await EllipseMarketMakerLib.new();
    });

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        await cln.makeTokensTransferable();
        await cln.transfer(notOwner, THOUSAND_CLN * 1000);
    });

    describe('Construction.', async () => {

        it('should not construct without market making lib address', async () => {
            await expectRevert(CurrencyFactory.new(null, cln.address,  {from: owner} ));
        });

        it('should not construct without address to CLN contract', async () => {
            await expectRevert(CurrencyFactory.new(mmLib.address, null,  {from: owner} ));
        });

        it('should construct with correct pramms', async () => {
            await cln.makeTokensTransferable();
            factory = await CurrencyFactory.new(mmLib.address, cln.address,  {from: owner} )
            assert.equal((await factory.clnAddress()) ,cln.address);
            assert.equal((await factory.mmLibAddress()) ,mmLib.address);
         });
    });

    describe('Creating Local Currency and its MarketMaker.', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            factory = await CurrencyFactory.new(mmLib.address, cln.address,  {from: factoryOwner} )
        });

        it('should not be able to create without name', async () => {
            await expectRevert(factory.createCurrency[CREATE_CURRENCY_SIGS.full]('', 'SON', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner}));
        });

        it('should not be able to create without symbol', async () => {
            await expectRevert(factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', '', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner}));
        });

        it('should not be able to create with zero supply', async () => {
            await expectRevert(factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON', 18, 0, 'ipfs://hash',{from: owner}));
        });

        it('should be able to create with correct parameters', async () => {
            let result = await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner});

            // Check correct events
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token;

            // check correct struct
            var currencyStruct = await factory.currencyMap(tokenAddress);
            assert.equal(currencyStruct[0], 'Some Name');
            assert.equal(currencyStruct[1], 18);
            assert.equal(currencyStruct[2], CC_MAX_TOKENS);
            assert.equal(currencyStruct[3], owner);
            assert(expect(currencyStruct[4]).to.be.a('String'));

            // check that CC was created properly
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.equal((await cc.name()), 'Some Name')
            assert.equal((await cc.symbol()), 'SON')
            assert.equal((await cc.decimals()), 18)
            assert.equal((await cc.totalSupply()), CC_MAX_TOKENS)
            assert.equal((await cc.tokenURI()), 'ipfs://hash')
            assert.equal((await cc.owner()), factory.address)
        });

        it('should be able to create with correct parameters (without metadata field)', async () => {
            let result = await factory.createCurrency[CREATE_CURRENCY_SIGS.withoutMetadata](
              'Some Name', 'SON', 18, CC_MAX_TOKENS, {from: owner});

            // Check correct events
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token;

            // check correct struct
            var currencyStruct = await factory.currencyMap(tokenAddress);
            assert.equal(currencyStruct[0], 'Some Name');
            assert.equal(currencyStruct[1], 18);
            assert.equal(currencyStruct[2], CC_MAX_TOKENS);
            assert.equal(currencyStruct[3], owner);
            assert(expect(currencyStruct[4]).to.be.a('String'));

            // check that CC was created properly
            cc = await ColuLocalCurrency.at(tokenAddress);
            assert.equal((await cc.name()), 'Some Name')
            assert.equal((await cc.symbol()), 'SON')
            assert.equal((await cc.decimals()), 18)
            assert.equal((await cc.totalSupply()), CC_MAX_TOKENS)
            assert.equal((await cc.tokenURI()), '')
            assert.equal((await cc.owner()), factory.address)
        });

        it('should be able to create a token with empty metadata', async () => {
          let result = await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON', 18, CC_MAX_TOKENS, '', {from: owner});
          cc = await ColuLocalCurrency.at(result.logs[0].args.token)
          assert.equal((await cc.tokenURI()), '')
        })

        it('should allow to create two tokens with same name', async () => {
            assert(await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON1', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner}));
            assert(await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON2', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner}));
        });

        it('should allow to create two tokens with same symbol', async () => {
            assert(await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name1', 'SON', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner}));
            assert(await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name2', 'SON', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner}));
        });
    });

    describe('Interact with MarketMaker through factory before opening market.', async () => {
        let cc;

        beforeEach(async () => {
            factory = await CurrencyFactory.new(mmLib.address, cln.address,  {from: factoryOwner} )
            assert.equal(await factory.clnAddress() ,cln.address);
            let result = await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON', 18, CC_MAX_TOKENS, 'ipfs://hash', {from: owner});
            assert.lengthOf(result.logs, 1);
            let event = result.logs[0];
            assert.equal(event.event, 'TokenCreated');
            tokenAddress = event.args.token;
            assert(expect(tokenAddress).to.be.a('String'));
            cc = await ColuLocalCurrency.at(tokenAddress);
        });

        it('should not be able to insert 0 CLN', async () => {
            await expectRevert(factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, 0, {from: owner}));
        });

        it('should not be able to insert CLN if no allowance was given', async () => {
            await expectRevert(factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
        });

        it('should not be able to insert CLN if not owner', async () => {
            await cln.approve(factory.address, THOUSAND_CLN, {from: notOwner});
            await expectRevert(factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: notOwner}));
        });

        it('should be able to insert CLN if owner (approve, transfer)', async () => {
            let balanceBefore = BigNumber(await cln.balanceOf(owner));
            await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
            assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}))
            let balanceNow = BigNumber(await cln.balanceOf(owner));
            assert(balanceBefore.minus(balanceNow).eq(THOUSAND_CLN));
            let cc1Balance = BigNumber(await cc.balanceOf(owner));

            assert.notEqual(BigNumber(cc1Balance.toNumber(), 0));
            // Gives correct number of CC tokens
            assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

            // inserting second time
            balanceBefore = balanceNow
            await cln.approve(factory.address, 2 * THOUSAND_CLN, {from: owner});
            assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, 2 * THOUSAND_CLN, {from: owner}))
            balanceNow = BigNumber(await cln.balanceOf(owner));
            assert(balanceBefore.minus(balanceNow).eq(2 * THOUSAND_CLN));
            cc1Balance = BigNumber(await cc.balanceOf(owner));
            assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 30000);
        });

        it('should be able to extract CC if owner and get back CLN', async () => {
            var clnvalue = BigNumber(await cln.balanceOf(owner));
            await cln.approve(factory.address, 2 * THOUSAND_CLN, {from: owner});
            assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, 2 * THOUSAND_CLN, {from: owner}))

            // CLN amount decreased by 1000
            assert(BigNumber(await cln.balanceOf(owner)).eq(clnvalue - (2 * THOUSAND_CLN)));

            var ccadder = await factory.currencyMap(tokenAddress);
            mm = await EllipseMarketMaker.at(ccadder[STRUCT_SIZE - 1]);
            var ccvalue = BigNumber(await cc.balanceOf(owner));
            assert.notEqual(ccvalue, 0);
            await cc.approve(factory.address, ccvalue, {from: owner});

            // extract all CC tokens in two operations
            assert(await factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, ccvalue / 2, {from: owner}));
            assert(await factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, await cc.balanceOf(owner), {from: owner}));

            var newclnValue = BigNumber(await cln.balanceOf(owner));
            // CLN value does not changed
            assert(newclnValue.eq(clnvalue));
            assert((await cc.balanceOf(owner)).eq(0));
        });

        it('should not be able to insert CC if not owner and get back CLN', async () => {
            var clnvalue = BigNumber(await cln.balanceOf(owner));
            await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
            assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
            var ccadder = await factory.currencyMap(tokenAddress);
            mm = await EllipseMarketMaker.at(ccadder[STRUCT_SIZE -1]);
            var ccvalue = BigNumber(await cc.balanceOf(owner));
            assert.notEqual(ccvalue, 0);

            //transfer CC to not owner of the currency
            await cc.transfer(notOwner, ccvalue, {from: owner});
            assert(BigNumber(await cc.balanceOf(notOwner)).eq(ccvalue));

            // notOwner tries to exchange CC for CLN
            await cc.approve(factory.address, ccvalue, {from: notOwner});
            await expectRevert(factory.extractCLNfromMarketMaker['address,uint256'](tokenAddress, ccvalue, {from: notOwner}));
            assert(BigNumber(await cc.balanceOf(notOwner)).eq(ccvalue));
        });

        describe('Interact with MarketMaker as a contract, using transferAndCall mechanism through CLN contract.', async () => {
          it('should not be able to insert CLN if not owner', async () => {
              // using mmLib contract as message sender
              let insertCLNtoMarketMakerMessage = encodeInsertData(mmLib.address);
              await expectRevert(cln.transferAndCall(factory.address, THOUSAND_CLN, insertCLNtoMarketMakerMessage));
          });

          it('should be able to insert CLN if owner', async () => {
              let insertCLNtoMarketMakerMessage = encodeInsertData(tokenAddress);
              await cln.transferAndCall(factory.address, THOUSAND_CLN, insertCLNtoMarketMakerMessage);
              assert.notEqual(BigNumber(await cc.balanceOf(owner)).toNumber(), 0);
              let cc1Balance = BigNumber(await cc.balanceOf(owner));
              assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

          });

          it('should not be able to extract CLN if not owner', async () => {
              let insertCLNtoMarketMakerMessage = encodeInsertData(tokenAddress);
              await cln.transferAndCall(factory.address, THOUSAND_CLN, insertCLNtoMarketMakerMessage);
              const ccBalance = BigNumber(await cc.balanceOf(owner));
              assert.notEqual(ccBalance.toNumber(), 0);

              const extractCLNfromMarketMaker = encodeExtractData();
              await expectRevert(cln.transferAndCall(factory.address, ccBalance, extractCLNfromMarketMaker));
          });

          it('should be able to extract CLN if owner', async () => {
              const clnInitialBalance = BigNumber(await cln.balanceOf(owner));
              const insertCLNtoMarketMakerMessage = encodeInsertData(tokenAddress);

              await cln.transferAndCall(factory.address, THOUSAND_CLN, insertCLNtoMarketMakerMessage);
              let cc1Balance = BigNumber(await cc.balanceOf(owner));
              assert.notEqual(cc1Balance.toNumber(), 0);
              assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

              // extract CLN from token
              const extractCLNfromMarketMaker = encodeExtractData();
              await cc.transferAndCall(factory.address, cc1Balance, extractCLNfromMarketMaker);


              // Check balance didn't changed
              cc1Balance = BigNumber(await cc.balanceOf(owner));
              const clnBalance = BigNumber(await cln.balanceOf(owner));
              assert(cc1Balance.eq(0));
              assert(clnBalance.eq(clnInitialBalance));
          });

          it('should be able to insert CLN into multiple currencies', async () => {
              // insert 1000 CLN to CC1
              let insertCLNtoMarketMakerMessage = encodeInsertData(tokenAddress);
              await cln.transferAndCall(factory.address, THOUSAND_CLN, insertCLNtoMarketMakerMessage);
              const cc1Balance = BigNumber(await cc.balanceOf(owner));
              assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

              // insert 2000 CLN to CC2
              tokenAddress2 = (await factory.createCurrency[CREATE_CURRENCY_SIGS.full](
                'Other Name', 'ON', 18, CC_MAX_TOKENS, '', {from: owner})).logs[0].args.token;
              const cc2 = await ColuLocalCurrency.at(tokenAddress2);
              insertCLNtoMarketMakerMessage = encodeInsertData(tokenAddress2);
              await cln.transferAndCall(factory.address, 2 * THOUSAND_CLN, insertCLNtoMarketMakerMessage);
              const cc2Balance = BigNumber(await cc2.balanceOf(owner));
              assert.equal(cc2Balance.div(TOKEN_DECIMALS).toFixed(0), 24495);
          });

          it('should be able to insert CLN both as transfer and transferAndCall ', async () => {
              const initialClnBalance = BigNumber(await cln.balanceOf(owner));

              // insert 1000 CLN to CC1 with transfer
              await cln.approve(factory.address, THOUSAND_CLN, {from: owner});
              assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress, THOUSAND_CLN, {from: owner}));
              let cc1Balance = BigNumber(await cc.balanceOf(owner));
              assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

              // insert 1000 CLN to CC1 with transferAndCall
              let insertCLNtoMarketMakerMessage = encodeInsertData(tokenAddress);
              await cln.transferAndCall(factory.address, THOUSAND_CLN, insertCLNtoMarketMakerMessage);
              cc1Balance = BigNumber(await cc.balanceOf(owner));
              assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 24495);

              const clnBalance = BigNumber(await cln.balanceOf(owner));
              assert(clnBalance.eq(initialClnBalance.minus(2 * THOUSAND_CLN)));
          });
        })

        it('should not be able to open market if not owner', async () => {
            await expectRevert(factory.openMarket(tokenAddress, {from: notOwner}));
        });

        it('should be able to open market if owner', async () => {
            let result = await factory.openMarket(tokenAddress, {from: owner});

            assert.equal(result.logs[0].event, 'OwnershipRequested');
            assert.equal(result.logs[1].event, 'OwnershipRequested');
            assert.equal(result.logs[2].event, 'MarketOpen');

            const marketMakerAddress = await factory.getMarketMakerAddressFromToken(tokenAddress);
            const marketMaker = await EllipseMarketMaker.at(marketMakerAddress);
            assert.equal(await marketMaker.newOwnerCandidate(), owner);
            assert.equal(await cc.newOwnerCandidate(), owner);

            await marketMaker.acceptOwnership({from: owner})
            await cc.acceptOwnership({from: owner})
            assert.equal(await marketMaker.owner(), owner);
            assert.equal(await cc.owner(), owner);
        });

        describe('Miscellaneous methods.', async () => {
            it('should support CLN token', async () => {
                assert(await factory.supportsToken(cln.address));
            });

            it('should support CC token', async () => {
                assert(await factory.supportsToken(tokenAddress));
            });

            it('should not support other contracts', async () => {
                assert.isNotOk(await factory.supportsToken(mmLib.address));
            });

            describe('Metadata functionality.', () => {
              it('should allow to update tokenURI if owner', async () => {
                const result = await factory.setTokenURI(cc.address, 'ipfs://newhash', {from: owner})
                assert.equal(await cc.tokenURI(), 'ipfs://newhash')
              })

              it('should not allow to update tokenURI if not owner', async () => {
                await expectRevert(factory.setTokenURI(cc.address, 'ipfs://newhash', {from: notOwner}))
                assert.equal(await cc.tokenURI(), 'ipfs://hash')
              })

              it('should not allow to update tokenURI if not owner', async () => {
                await expectRevert(factory.setTokenURI(cc.address, 'ipfs://newhash', {from: notOwner}))
                assert.equal(await cc.tokenURI(), 'ipfs://hash')
              })

              context('After the issuance.', () => {
                beforeEach(async () => {
                  await factory.openMarket(tokenAddress, {from: owner})
                  await cc.acceptOwnership({from: owner})
                })

                it('should allow to update tokenURI if owner', async () => {
                  await cc.setTokenURI('ipfs://newhash', {from: owner})
                  assert.equal(await cc.tokenURI(), 'ipfs://newhash')
                })

                it('should not allow to update tokenURI if not owner', async () => {
                  await expectRevert(cc.setTokenURI('ipfs://newhash', {from: notOwner}))
                  assert.equal(await cc.tokenURI(), 'ipfs://hash')
                })

                it('should not allow to update tokenURI via the issuance', async () => {
                  await expectRevert(factory.setTokenURI(tokenAddress, 'ipfs://newhash', {from: notOwner}))
                  assert.equal(await cc.tokenURI(), 'ipfs://hash')
                })
              })
            })
        });
    });


    describe('Create two different currencies one after another.', async () => {
      let tokenAddress1;
      let tokenAddress2;

      let owner1 = accounts[0];
      let owner2 = accounts[1];

      beforeEach(async () => {
          factory = await CurrencyFactory.new(mmLib.address, cln.address,  {from: factoryOwner} )
          let result = await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Some Name', 'SON', 18, CC_MAX_TOKENS, '', {from: owner1});
          let event = result.logs[0];
          tokenAddress1 = event.args.token;

          result = await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Other Name', 'ON', 18, CC_MAX_TOKENS, '', {from: owner2});
          event = result.logs[0];
          tokenAddress2 = event.args.token;
      });

      it('should be able to insert CLN into multiple currencies for multiple owners', async () => {
          // insert to first currency
          const balanceBefore = BigNumber(await cln.balanceOf(owner1));
          await cln.approve(factory.address, THOUSAND_CLN, {from: owner1});
          assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress1, THOUSAND_CLN, {from: owner1}))
          const balanceNow = BigNumber(await cln.balanceOf(owner1));
          assert(balanceBefore.minus(balanceNow).eq(THOUSAND_CLN));
          const cc1 = await ColuLocalCurrency.at(tokenAddress1);
          const cc1Balance = BigNumber(await cc1.balanceOf(owner1))
          assert.notEqual(cc1Balance.toNumber(), 0);
          assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

          // insert to second currency
          const balanceBefore2 = BigNumber(await cln.balanceOf(owner2));
          await cln.approve(factory.address, 2 * THOUSAND_CLN, {from: owner2});
          assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress2, 2 * THOUSAND_CLN, {from: owner2}))
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

      it('should be able to insert CLN into multiple currencies for same owner', async () => {
          // insert to first currency
          let balanceBefore = BigNumber(await cln.balanceOf(owner1));
          await cln.approve(factory.address, THOUSAND_CLN, {from: owner1});
          assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress1, THOUSAND_CLN, {from: owner1}))
          let balanceNow = BigNumber(await cln.balanceOf(owner1));
          assert(balanceBefore.minus(balanceNow).eq(THOUSAND_CLN));
          const cc1 = await ColuLocalCurrency.at(tokenAddress1);
          const cc1Balance = BigNumber(await cc1.balanceOf(owner1))
          assert.notEqual(cc1Balance.toNumber(), 0);
          assert.equal(cc1Balance.div(TOKEN_DECIMALS).toFixed(0), 17321);

          // Create another currency
          result = await factory.createCurrency[CREATE_CURRENCY_SIGS.full]('Other Name', 'ON', 18, CC_MAX_TOKENS, '', {from: owner1});
          event = result.logs[0];
          tokenAddress3 = event.args.token;

          // insert to second currency
          balanceBefore = balanceNow;
          await cln.approve(factory.address, 2 * THOUSAND_CLN, {from: owner1});
          assert(await factory.insertCLNtoMarketMaker['address,uint256'](tokenAddress3, 2 * THOUSAND_CLN, {from: owner1}))
          balanceNow = BigNumber(await cln.balanceOf(owner1));
          assert(balanceBefore.minus(balanceNow).eq(2 * THOUSAND_CLN));
          const cc2 = await ColuLocalCurrency.at(tokenAddress3);
          const cc2Balance = BigNumber(await cc2.balanceOf(owner1));
          assert.notEqual(cc2Balance.toNumber(), 0);
          assert.equal(cc2Balance.div(TOKEN_DECIMALS).toFixed(0), 24495);


          // check CC1 doesn't effect CC2
          assert(balanceNow.eq(await cln.balanceOf(owner1)));
          assert(cc1Balance.eq(await cc1.balanceOf(owner1)));
          assert(cc2Balance.eq(await cc2.balanceOf(owner1)));
      });

    });
});
