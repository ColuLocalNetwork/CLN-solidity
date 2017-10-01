var SafeMath = artifacts.require("./SafeMath.sol");
var Ownable = artifacts.require("./Ownable.sol");

var TestToken = artifacts.require('./TestToken.sol');

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.deploy(Ownable);

  deployer.link(SafeMath, TestToken);
  deployer.link(Ownable, TestToken);

  deployer.deploy(TestToken);
};

