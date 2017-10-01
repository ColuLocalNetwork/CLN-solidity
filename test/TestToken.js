var TestToken = artifacts.require("./TestToken.sol");

var expectRevert = require('./helpers/expectRevert');

contract('TestToken', function (accounts) {
  
  var initialTokens = 1000000000
  var owner = accounts[0]
  var account2 = accounts[1];
  var account3 = accounts[2];
  var allowance = 100;
  var amount = 10;

  var token

  before(function () {
    return TestToken.new(initialTokens).then(function (instance) {
      token = instance
    })
  })

  it("account 0 (owner) should have initial tokens.", function () {
    return token.balanceOf(owner).then(function (balance) {
      assert.equal(balance.valueOf(), initialTokens, initialTokens + " wasn't in the first account");
    });
  });

  it("should fail to transfer before transfers unlock", function () {
    return expectRevert(token.transfer(account2, amount, {from: owner}))
  })

  it("should owner transfer tokens correctly", function () {
    // Get initial balances of first and second account.
    var ownerStartingBalance;
    var account2StartingBalance;
    var ownerEndingBalance;
    var account2EndingBalance;

    return token.balanceOf(owner).then(function (balance) {
      ownerStartingBalance = balance.toNumber();
      return token.balanceOf(account2).then(function (balance) {
        account2StartingBalance = balance.toNumber();
        return token.ownerTransfer(account2, amount, {from: owner}).then(function () {
          return token.balanceOf(owner).then(function (balance) {
            ownerEndingBalance = balance.toNumber();
            return token.balanceOf(account2).then(function (balance) {
              account2EndingBalance = balance.toNumber();

              assert.equal(ownerEndingBalance, ownerStartingBalance - amount, "Amount wasn't correctly taken from the sender");
              assert.equal(account2EndingBalance, account2StartingBalance + amount, "Amount wasn't correctly sent to the receiver");
            });
          });
        });
      });
    });
  });

  it("should failed on owner transfer more the account has", function () {
    return expectRevert(token.ownerTransfer(account2, initialTokens + 1, {from: owner}))
  })

  it("should fail on allowance before transfers unlock", function () {
    return expectRevert(token.approve(account2, allowance, {from: owner}))
  })

  it("should unlock transfers", function () {
    return token.makeTokensTransferable({from: owner})
  })

  it("should transfer tokens correctly", function () {
    // Get initial balances of first and second account.
    var ownerStartingBalance;
    var account2StartingBalance;
    var ownerEndingBalance;
    var account2EndingBalance;

    return token.balanceOf(owner).then(function (balance) {
      ownerStartingBalance = balance.toNumber();
      return token.balanceOf(account2).then(function (balance) {
        account2StartingBalance = balance.toNumber();
        return token.transfer(account2, amount, {from: owner}).then(function () {
          return token.balanceOf(owner).then(function (balance) {
            ownerEndingBalance = balance.toNumber();
            return token.balanceOf(account2).then(function (balance) {
              account2EndingBalance = balance.toNumber();

              assert.equal(ownerEndingBalance, ownerStartingBalance - amount, "Amount wasn't correctly taken from the sender");
              assert.equal(account2EndingBalance, account2StartingBalance + amount, "Amount wasn't correctly sent to the receiver");
            });
          });
        });
      });
    });
  });

  it("should fail to transfer more then what the account has", function () {
    // Get initial balances of first and second account.
    var account2StartingBalance;

    return token.balanceOf(account2).then(function (balance) {
      account2StartingBalance = balance.toNumber();
      return expectRevert(token.transfer(account3, account2StartingBalance + 1, {from: account2}))
    });
  });

  it("should transfer all tokens correctly", function () {
    // Get initial balances of first and second account.
    var account2StartingBalance;
    var account3StartingBalance;
    var account2EndingBalance;
    var account3EndingBalance;

    return token.balanceOf(account2).then(function (balance) {
      account2StartingBalance = balance.toNumber();
      assert(account2StartingBalance, "account2StartingBalance should be greater the zero.")
      return token.balanceOf(account3).then(function (balance) {
        account3StartingBalance = balance.toNumber();
        return token.transfer(account3, account2StartingBalance, {from: account2}).then(function () {
          return token.balanceOf(account2).then(function (balance) {
            account2EndingBalance = balance.toNumber();
            return token.balanceOf(account3).then(function (balance) {
              account3EndingBalance = balance.toNumber();

              assert.equal(account2EndingBalance, 0, "Amount wasn't correctly taken from the sender");
              assert.equal(account3EndingBalance, account3StartingBalance + account2StartingBalance, "Amount wasn't correctly sent to the receiver");
            });
          });
        });
      });
    });
  });

  it("should fail to owner transfer after transfers unlock", function () {
    return expectRevert(token.ownerTransfer(account2, amount, {from: owner}))
  })

  it("should success allowance.", function () {
    return token.approve(account2, allowance, {from: owner}).then(function () {
      return token.allowance(owner, account2).then(function (_allowance) {
        assert.equal(allowance, _allowance.toNumber())
      })
    })
  })

  it("account2 should spent from his allowance", function () {
    var ownerStartingBalance
    var account2StartingBalance
    var account3StartingBalance
    var account2StartingAllownace
    var ownerEndingBalance
    var account2EndingBalance
    var account3EndingBalance
    var account2EndingAllowance

    return token.balanceOf(owner).then(function (balance) {
      ownerStartingBalance = balance.toNumber();
      return token.balanceOf(account2).then(function (balance) {
        account2StartingBalance = balance.toNumber();
        return token.balanceOf(account3).then(function (balance) {
          account3StartingBalance = balance.toNumber();
          return token.allowance(owner, account2).then(function (_allowance) {
            account2StartingAllownace = _allowance.toNumber()
            return token.transferFrom(owner, account3, amount, {from: account2}).then(function () {
              return token.balanceOf(owner).then(function (balance) {
                ownerEndingBalance = balance.toNumber();
                return token.balanceOf(account2).then(function (balance) {
                  account2EndingBalance = balance.toNumber();
                  return token.balanceOf(account3).then(function (balance) {
                    account3EndingBalance = balance.toNumber();
                    return token.allowance(owner, account2).then(function (_allowance) {
                      account2EndingAllowance = _allowance

                      assert.equal(ownerEndingBalance, ownerStartingBalance - amount, "Amount wasn't correctly taken from the sender");
                      assert.equal(account2StartingBalance, account2EndingBalance, "Invoker amount should't change");
                      assert.equal(account3EndingBalance, account3StartingBalance + amount, "Amount wasn't correctly sent to the receiver");
                      assert.equal(account2EndingAllowance, account2StartingAllownace - amount, "Allowance wasn't correctly change");
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  })

  it("account2 should not spent more then his allowance", function () {
    var ownerStartingBalance
    var account2StartingBalance
    var account3StartingBalance
    var account2StartingAllownace

    return token.balanceOf(owner).then(function (balance) {
      ownerStartingBalance = balance.toNumber();
      return token.balanceOf(account2).then(function (balance) {
        account2StartingBalance = balance.toNumber();
        return token.balanceOf(account3).then(function (balance) {
          account3StartingBalance = balance.toNumber();
          return token.allowance(owner, account2).then(function (_allowance) {
            account2StartingAllownace = _allowance.toNumber()

            assert(account2StartingAllownace);
            assert(ownerStartingBalance >= account2StartingAllownace)
            return expectRevert(token.transferFrom(owner, account3, account2StartingAllownace + 1, {from: account2}))
          });
        });
      });
    });
  })

  it("totalSupply should be equal to initialTokens", function () {
    return token.totalSupply().then(function (amount) {
      assert(initialTokens, amount.toNumber())
    })
  })
});
