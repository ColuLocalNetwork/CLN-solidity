const expectRevert = require('./helpers/expectRevert');
const coder = require('web3-eth-abi');
const expect = require('chai').expect;

const ColuLocalNetwork = artifacts.require('ColuLocalNetwork');
const EllipseMarketMaker = artifacts.require('EllipseMarketMaker');
const CurrencyFactory = artifacts.require('CurrencyFactory');
const ColuLocalCurrency = artifacts.require('ColuLocalCurrency');

const TOKEN_DECIMALS = 10 ** 18;

const THOUSAND_CLN = 1000 * TOKEN_DECIMALS;

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

const INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI = {
    name: 'insertCLNtoMarketMaker',
    type: 'function',
    inputs: [],
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

const INITIALIZE_ON_TRANSFER_DATA = coder.encodeFunctionCall(INITIALIZE_ON_TRANSFER_ABI, []);

const CHANGE_SIGS = {
    afterApprove: 'address,uint256,address',
    afterApproveWithMin: 'address,uint256,address,uint256',
    onTransfer: 'address',
    onTransferWithMin: 'address,uint256',
};

const encodeData = (out) => {
    let abi, params;
    if (!out) {
        abi = INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI;
        //console.log('encoding INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI')
        //params = [toToken];
    } else {
        abi = EXTRACT_FROM_MM_AND_TRANSFER_WITH_MIN_ABI;
        //params = [toToken];
    }
    return coder.encodeFunctionCall(abi);
};

contract('CurrencyFactory', (accounts) => {
    let cln;

    let Factory;
    let mmAdress;

    let owner = accounts[0];
    let nonOwner = accounts[1];

    let amount = 50 * TOKEN_DECIMALS;

    beforeEach(async () => {
        cln = await ColuLocalNetwork.new(CLN_MAX_TOKENS);
        await cln.makeTokensTransferable();
        await cln.transfer(accounts[1], THOUSAND_CLN * 1000);        
    });

    describe('construction', async () => {
        it('should not construct with no address to cln contract', async () => {
            await expectRevert(CurrencyFactory.new( null,  {from: accounts[0]} ));
        });

        it('should construct with correct pramms', async () => {
            await cln.makeTokensTransferable();
            Factory = await CurrencyFactory.new( cln.address,  {from: accounts[0]} )
            assert(Factory.clnAddress != cln.address);
         });
    });

    describe('creating a MarketMaker', async () => {
        beforeEach(async () => {
            await cln.makeTokensTransferable();
            Factory = await CurrencyFactory.new( cln.address,  {from: accounts[0]} )
        });

        it('should not be able to create without name', async () => {
            await expectRevert(Factory.createCurrency('', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });

        it('should not be able to create without symbol', async () => {
            await expectRevert(Factory.createCurrency('Some Name', '', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });


        it('should not be able to create with zero decimals', async () => {
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 0, CC_MAX_TOKENS, {from: accounts[0]}));
        });


        it('should not be able to create with zero supply', async () => {
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 18, 0, {from: accounts[0]}));
        });

        it('should be able to create with correct parameters', async () => {
            mmAdress = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
            assert(expect(mmAdress).to.be.a('Object'));
        });

        it('should not be able to create with same message sender', async () => {
            await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
            await expectRevert(Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]}));
        });

    });

    describe('Interact with MarketMaker through factory before opening market', async () => {


        beforeEach(async () => {
            
            Factory = await CurrencyFactory.new( cln.address,  {from: accounts[0]} )
            assert(Factory.clnAddress != cln.address);
            mmAdress = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
            assert(expect(mmAdress).to.be.a('Object'));
        });

        it('should not be able to insert 0 cln', async () => {
            await expectRevert(Factory.insertCLNtoMarketMaker(0, {from: accounts[0]}))
        });

        it('should not be able to insert cln if no allowance was given', async () => {
            await expectRevert(Factory.insertCLNtoMarketMaker(THOUSAND_CLN, {from: accounts[0]}))
        });

        it('should not be able to insert cln if not owner', async () => {
            cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
            await expectRevert(Factory.insertCLNtoMarketMaker(THOUSAND_CLN, {from: accounts[1]}))
        });

        it('should be able to insert cln if owner (approve, transfer)', async () => {
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[0]})
            assert(await Factory.insertCLNtoMarketMaker["uint256"](THOUSAND_CLN, {from: accounts[0]}))
            var ccadder = await Factory.currecnyMap(accounts[0]);
            cc = await ColuLocalCurrency.at(ccadder[3])
            assert.notEqual(Number(await cc.balanceOf(accounts[0])), 0);
        });

        it('should be able to insert cc if owner and get back cln', async () => {
            var clnvalue = Number(await cln.balanceOf(accounts[0]));
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[0]})
            assert(await Factory.insertCLNtoMarketMaker["uint256"](THOUSAND_CLN, {from: accounts[0]}))
            var ccadder = await Factory.currecnyMap(accounts[0]);
            cc = await ColuLocalCurrency.at(ccadder[3])
            mm = await EllipseMarketMaker.at(ccadder[4])
            var ccvalue = Number(await cc.balanceOf(accounts[0]));
            assert.notEqual(ccvalue, 0);
            await cc.approve(Factory.address, ccvalue, {from: accounts[0]})
            assert(await Factory.extractCLNfromMarketMaker["uint256"](ccvalue, {from: accounts[0]}))
            var newclnValue = Number(await cln.balanceOf(accounts[0]))
            assert.equal(newclnValue, clnvalue)
        });


        it('should not be able to insert cc if not owner and get back cln', async () => {
            var clnvalue = Number(await cln.balanceOf(accounts[0]));
            await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[0]})
            assert(await Factory.insertCLNtoMarketMaker["uint256"](THOUSAND_CLN, {from: accounts[0]}))
            var ccadder = await Factory.currecnyMap(accounts[0]);
            cc = await ColuLocalCurrency.at(ccadder[3])
            mm = await EllipseMarketMaker.at(ccadder[4])
            var ccvalue = Number(await cc.balanceOf(accounts[0]));
            assert.notEqual(ccvalue, 0);
            await cc.transfer(accounts[1], ccvalue, {from: accounts[0]})
            await cc.approve(Factory.address, ccvalue, {from: accounts[1]})
            console.log("expect revert")
            await expectRevert(Factory.extractCLNfromMarketMaker["uint256"](ccvalue, {from: accounts[1]}))
            assert.notEqual(ccvalue, cc.balanceOf(accounts[1]));
        });


        it('should be able to insert cln if owner (callAndTransfer)', async () => {
            var ccadder = await Factory.currecnyMap(accounts[0]);
            let changeData = encodeData(false);
            await cln.transferAndCall(Factory.address, THOUSAND_CLN, changeData);
            cc = await ColuLocalCurrency.at(ccadder[3])
            assert.notEqual(Number(await cc.balanceOf(accounts[0])), 0);
        });

        it('should not be able to open market if not owner', async () => {
            await expectRevert(Factory.openMarket({from: accounts[1]}))
        })

        it('should be able to open market if owner', async () => {
            await Factory.openMarket({from: accounts[0]})
        })




        
    });


// describe.only('Interact with MarketMaker directly after opening market', async () => {


//         beforeEach(async () => {
//             await cln.makeTokensTransferable();
//             Factory = await CurrencyFactory.new( cln.address,  {from: accounts[0]} )
//             assert(Factory.clnAddress != cln.address);
//             mmAdress = await Factory.createCurrency('Some Name', 'SON', 18, CC_MAX_TOKENS, {from: accounts[0]});
//             assert(expect(mmAdress).to.be.a('Object'));
//             assert.notEqual(await Factory.openMarket({from: accounts[0]}), true);
//         });

//         it.only('should be able to insert cln if not owner (approve, transfer)', async () => {
//             await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
//             console.log('after approve', Number(THOUSAND_CLN))
//             console.log('after approve2', Number(await cln.balanceOf(accounts[1])))
//             assert(await Factory.insertCLNtoMarketMaker["uint256"](THOUSAND_CLN, {from: accounts[1]}))
//             console.log('after insert', Number(await cln.balanceOf(accounts[1])))
//             var ccadder = await Factory.currecnyMap(accounts[0]);
//             cc = await ColuLocalCurrency.at(ccadder[3])
//             assert.notEqual(Number(await cc.balanceOf(accounts[1])), 0);
//         });

//         it('should be able to insert cln if not owner (callAndTransfer)', async () => {
//             var ccadder = await Factory.currecnyMap(accounts[0]);
//             let changeData = encodeData(false);
//             await cln.transferAndCall(Factory.address, THOUSAND_CLN, changeData);
//             cc = await ColuLocalCurrency.at(ccadder[3])
//             assert.notEqual(Number(await cc.balanceOf(accounts[1])), 0);
//         });

//         it('should be able to insert cc if not owner and get back cln', async () => {
//             var clnvalue = Number(await cln.balanceOf(accounts[0]));
//             await cln.approve(Factory.address, THOUSAND_CLN, {from: accounts[1]})
//             assert(await Factory.insertCLNtoMarketMaker["uint256"](THOUSAND_CLN, {from: accounts[1]}))
//             var ccadder = await Factory.currecnyMap(accounts[1]);
//             cc = await ColuLocalCurrency.at(ccadder[3])
//             mm = await EllipseMarketMaker.at(ccadder[4])
//             var ccvalue = Number(await cc.balanceOf(accounts[1]));
//             assert.notEqual(ccvalue, 0);
//             await cc.transfer(accounts[1], ccvalue, {from: accounts[1]})
//             await cc.approve(Factory.address, ccvalue, {from: accounts[1]})
//             await Factory.extractCLNfromMarketMaker["uint256"](ccvalue, {from: accounts[1]})
//             assert.notEqual(ccvalue, cc.balanceOf(accounts[1]));
//         });



//     });
});