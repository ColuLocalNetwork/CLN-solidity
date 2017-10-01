const TestToken = artifacts.require("./TestToken.sol");

const expectRevert = require('./helpers/expectRevert');

contract('TestToken', function (accounts) {
  
  const initialTokens = 1000000000
  const owner = accounts[0]
  const account2 = accounts[1];
  const account3 = accounts[2];
  const allowance = 100;
  const amount = 10;

  let token;

  before(async () => {
    token = await TestToken.new(initialTokens)
  })

  it("account 0 (owner) should have initial tokens.", async () => {
    balance = await token.balanceOf(owner)
    assert.equal(balance.valueOf(), initialTokens, initialTokens + " wasn't in the first account");
  });

  it("should fail to transfer before transfers unlock", async () => {
    await expectRevert(token.transfer(account2, amount, {from: owner}))
  })

  it("should owner transfer tokens correctly", async () => {
    // Get initial balances of first and second account.
    let ownerStartingBalance;
    let account2StartingBalance;
    let ownerEndingBalance;
    let account2EndingBalance;

    [ownerStartingBalance, account2StartingBalance] = (await Promise.all([token.balanceOf(owner), token.balanceOf(account2)])).map( (balance) => {return balance.toNumber()});

    await token.ownerTransfer(account2, amount, {from: owner});
    
    [ownerEndingBalance, account2EndingBalance] = (await Promise.all([token.balanceOf(owner), token.balanceOf(account2)])).map( (balance) => {return balance.toNumber()});

    assert.equal(ownerEndingBalance, ownerStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(account2EndingBalance, account2StartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  });

  it("should failed on owner transfer more the account has", async () => {
    await expectRevert(token.ownerTransfer(account2, initialTokens + 1, {from: owner}))
  })

  it("should fail on allowance before transfers unlock", async () => {
    await expectRevert(token.approve(account2, allowance, {from: owner}))
  })

  it("should unlock transfers", async () => {
    await token.makeTokensTransferable({from: owner})
  })

  it("should transfer tokens correctly", async () => {
    // Get initial balances of first and second account.
    let ownerStartingBalance;
    let account2StartingBalance;
    let ownerEndingBalance;
    let account2EndingBalance;

    [ownerStartingBalance, account2StartingBalance] = (await Promise.all([token.balanceOf(owner), token.balanceOf(account2)])).map( (balance) => {return balance.toNumber()});

    await token.transfer(account2, amount, {from: owner});
    
    [ownerEndingBalance, account2EndingBalance] = (await Promise.all([token.balanceOf(owner), token.balanceOf(account2)])).map( (balance) => {return balance.toNumber()});

    assert.equal(ownerEndingBalance, ownerStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(account2EndingBalance, account2StartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  });

  it("should fail to transfer more then what the account has", async () => {
    // Get initial balances of first and second account.
    let account2StartingBalance;

    account2StartingBalance = (await token.balanceOf(account2)).toNumber()
    await expectRevert(token.transfer(account3, account2StartingBalance + 1, {from: account2}))
  });

  it("should transfer all tokens correctly", async () => {
    // Get initial balances of first and second account.
    let account2StartingBalance;
    let account3StartingBalance;
    let account2EndingBalance;
    let account3EndingBalance;

    [account2StartingBalance, account3StartingBalance] = (await Promise.all([token.balanceOf(account2), token.balanceOf(account3)])).map( (balance) => {return balance.toNumber()});

    await token.transfer(account3, account2StartingBalance, {from: account2});

    [account2EndingBalance, account3EndingBalance] = (await Promise.all([token.balanceOf(account2), token.balanceOf(account3)])).map( (balance) => {return balance.toNumber()});

    assert.equal(account2EndingBalance, 0, "Amount wasn't correctly taken from the sender");
    assert.equal(account3EndingBalance, account3StartingBalance + account2StartingBalance, "Amount wasn't correctly sent to the receiver");
  });

  it("should fail to owner transfer after transfers unlock", async () => {
    await expectRevert(token.ownerTransfer(account2, amount, {from: owner}))
  })

  it("should success allowance.", async () => {
    await token.approve(account2, allowance, {from: owner})
    let _allowance = await token.allowance(owner, account2)
    assert.equal(allowance, _allowance.toNumber())
  })

  it("account2 should spent from his allowance", async () => {
    let ownerStartingBalance
    let account2StartingBalance
    let account3StartingBalance
    let account2StartingAllownace
    let ownerEndingBalance
    let account2EndingBalance
    let account3EndingBalance
    let account2EndingAllowance

    [ownerStartingBalance, account2StartingBalance, account3StartingBalance, account2StartingAllownace] = 
      (await Promise.all([
        token.balanceOf(owner),
        token.balanceOf(account2),
        token.balanceOf(account3),
        token.allowance(owner, account2)
      ])).map( (balance) => {return balance.toNumber()});

    await token.transferFrom(owner, account3, amount, {from: account2});

    [ownerEndingBalance, account2EndingBalance, account3EndingBalance, account2EndingAllowance] = 
      (await Promise.all([
        token.balanceOf(owner),
        token.balanceOf(account2),
        token.balanceOf(account3),
        token.allowance(owner, account2)
      ])).map( (balance) => {return balance.toNumber()});

    assert.equal(ownerEndingBalance, ownerStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(account2StartingBalance, account2EndingBalance, "Invoker amount should't change");
    assert.equal(account3EndingBalance, account3StartingBalance + amount, "Amount wasn't correctly sent to the receiver");
    assert.equal(account2EndingAllowance, account2StartingAllownace - amount, "Allowance wasn't correctly change");
  })

  it("account2 should not spent more then his allowance", async () => {
    let ownerStartingBalance
    let account2StartingBalance
    let account3StartingBalance
    let account2StartingAllownace

    [ownerStartingBalance, account2StartingBalance, account3StartingBalance, account2StartingAllownace] = 
      (await Promise.all([
        token.balanceOf(owner),
        token.balanceOf(account2),
        token.balanceOf(account3),
        token.allowance(owner, account2)
      ])).map( (balance) => {return balance.toNumber()});

    assert(account2StartingAllownace);
    assert(ownerStartingBalance >= account2StartingAllownace)
    await expectRevert(token.transferFrom(owner, account3, account2StartingAllownace + 1, {from: account2}))
  })

  it("totalSupply should be equal to initialTokens", async () => {
    let amount = await token.totalSupply()
    assert(initialTokens, amount.toNumber())
  })
});
