
# CLN Tutorial

This tutorial will guide you through the issuance, interaction, and exchange of Community Currencies, abbreviated as CC. To follow this tutorial you should have a basic understanding of Ethereum and blockchain technologies, [Ethereum wiki](https://github.com/ethereum/wiki/wiki) is a great place to start. [This overview](../overview.md) gives a high level explanation of the CLN contracts, and a [contract reference](../reference) provides a self generated documentation similar to REST API docs.


From a practical side you will need an ERC20 compatible wallet to send and sign transactions. I will use [MyEtherWallet](https://www.myetherwallet.com/) because of its ability to generate transactions from ABI. If you don't familiar with MyEtherWallet, there's a [tutorial](https://myetherwallet.github.io/knowledge-base/getting-started/accessing-your-new-eth-wallet.html) how to open a wallet and send ETH.

 Also of course you will need ETH to pay for gas, and CLN to interact with the contracts of Colu Local Network. You can learn more about the relation of CLN and Community Currencies (CC) from the [whitepaper](https://cln.network/pdf/cln_whitepaper.pdf).

To proceed with this guide I've created a new Ethereum account - [0x0d4DF041Dbef6fFC0E444a4a213774AdB0c118C2](https://ropsten.etherscan.io/address/0x0d4DF041Dbef6fFC0E444a4a213774AdB0c118C2). I'm going to perform all actions on Ropsten Test Network, so you can follow. We encourage you first to use testnet until a sufficient understanding of the CLN contracts is achieved.


## Table of Contents

The tutorial is divided to several parts:
- [Acquiring CLN](0_Acquiring_CLN.md) - Prerequisite for contracts usage.
- [Currency Factory](1_CurrencyFactory.md) - Community Currency issuance by an individual issuer.
- [Market Maker](2_MarketMaker.md) - the internal mechanics of CLN and Community Currency exchange.
- Issuance Factory - Community Currency issuance in a crowdfunding model.

## Contract Addresses

#### Ropsten Test Network
- [ColuLocalNetwork](../reference/ColuLocalNetwork.md) -  [0x41c9d91e96b933b74ae21bcbb617369cbe022530](https://ropsten.etherscan.io/address/0x41c9d91e96b933b74ae21bcbb617369cbe022530)
- [ColuLocalNetworkSale](../reference/ColuLocalNetworkSale.md) - [0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48](https://ropsten.etherscan.io/address/0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48)
- [CurrencyFactory](../reference/CurrencyFactory.md) - [0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59](https://ropsten.etherscan.io/address/0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59)
- [IssuanceFactory](../reference/IssuanceFactory.md) - [0xd352492ebeb9fad92147a3719766d7afe38fe26e](https://ropsten.etherscan.io/address/0xd352492ebeb9fad92147a3719766d7afe38fe26e)
- [EllipseMarketMakerLib](../reference/EllipseMarketMakerLib.md) - [0x30724fa809d40330eacab9c7ebcfb2a0058c381c](https://ropsten.etherscan.io/address/0x30724fa809d40330eacab9c7ebcfb2a0058c381c)


#### Main Network

- [ColuLocalNetwork](../reference/ColuLocalNetwork.md) - [0x4162178B78D6985480A308B2190EE5517460406D](https://etherscan.io/address/0x4162178b78d6985480a308b2190ee5517460406d)
- [ColuLocalNetworkSale](../reference/ColuLocalNetworkSale.md) - [0x12321Fb3e2548b03eaD42F09cAb239cff377b4e2](https://etherscan.io/address/0x12321fb3e2548b03ead42f09cab239cff377b4e2)
- [CurrencyFactory](../reference/CurrencyFactory.md) - [0x21851f9970e333cbc253ba2c7ef953219c479ab7](https://etherscan.io/address/0x21851f9970e333cbc253ba2c7ef953219c479ab7)
- [IssuanceFactory](../reference/IssuanceFactory.md) - [0xe3444f1aac1a37b8cce47db260d1c6e25a2f627b](https://etherscan.io/address/0xe3444f1aac1a37b8cce47db260d1c6e25a2f627b)
- [EllipseMarketMakerLib](../reference/EllipseMarketMakerLib.md) - [0xc70636e0886eC4a4F2B7e42aC57ccD1B976352d0](https://etherscan.io/address/0xc70636e0886ec4a4f2b7e42ac57ccd1b976352d0)
