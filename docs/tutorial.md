
# CLN Tutorial

This tutorial will guide you through the issuance, interaction, and exchange of community coins (CC). To follow this tutorial you should have a basic understanding of Ethereum and blockhain technologies. You can start from the [Ethereum wiki](https://github.com/ethereum/wiki/wiki/Ethereum-introduction) or this [awesome list](https://github.com/ethereum/wiki/wiki/Ethereum-introduction) of links currated by the community. The [overview](overview.md) gives a high level explanation of the CLN conracts, and a [contract reference](reference) provides a self generated documentation similar to REST API docs.

From a practical aspect you will need an ERC20 compatible wallet to send and sign transactions. I will use [MyEtherWallet](https://www.myetherwallet.com/) because of it's abillity to generate transactions from ABI. Also of course you will need ETH to pay for gas, and CLN - the base token of the Colu Local Network. You can learn more about the relation of CLN and CC from the [whitepapper](https://cln.network/pdf/cln_whitepaper.pdf).

We encourage you first to use testnet untill a sufficient understanding of the CLN contracts is achieved.


## Contract Addresses

#### Ropsten Test Network
- [ColuLocalNetwork](reference/ColuLocalNetwork.md) -  [0x41c9d91e96b933b74ae21bcbb617369cbe022530](https://ropsten.etherscan.io/address/0x41c9d91e96b933b74ae21bcbb617369cbe022530)
- [ColuLocalNetworkSale](reference/ColuLocalNetworkSale.md): [0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48](https://ropsten.etherscan.io/address/0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48)
- [CurrencyFactory](reference/CurrencyFactory.md): [0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59](https://ropsten.etherscan.io/address/0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59)
- [IssuanceFactory](reference/IssuanceFactory.md): [0xd352492ebeb9fad92147a3719766d7afe38fe26e](https://ropsten.etherscan.io/address/0xd352492ebeb9fad92147a3719766d7afe38fe26e)
- [EllipseMarketMakerLib](reference/EllipseMarketMakerLib.md): [0x30724fa809d40330eacab9c7ebcfb2a0058c381c](https://ropsten.etherscan.io/address/0x30724fa809d40330eacab9c7ebcfb2a0058c381c)


#### Main Network

- [ColuLocalNetwork](reference/ColuLocalNetwork.md): [0x4162178B78D6985480A308B2190EE5517460406D](https://etherscan.io/address/0x4162178b78d6985480a308b2190ee5517460406d)
- [ColuLocalNetworkSale](reference/ColuLocalNetworkSale.md): [0x12321Fb3e2548b03eaD42F09cAb239cff377b4e2](https://etherscan.io/address/0x12321fb3e2548b03ead42f09cab239cff377b4e2)
- [CurrencyFactory](reference/CurrencyFactory.md): [0x21851f9970e333cbc253ba2c7ef953219c479ab7](https://etherscan.io/address/0x21851f9970e333cbc253ba2c7ef953219c479ab7)
- [IssuanceFactory](reference/IssuanceFactory.md): [0xe3444f1aac1a37b8cce47db260d1c6e25a2f627b](https://etherscan.io/address/0xe3444f1aac1a37b8cce47db260d1c6e25a2f627b)
- [EllipseMarketMakerLib](reference/EllipseMarketMakerLib.md): [0xc70636e0886eC4a4F2B7e42aC57ccD1B976352d0](https://etherscan.io/address/0xc70636e0886ec4a4f2b7e42ac57ccd1b976352d0)


## Acquiring CLN

For Mainnet, if you didn't get some tokens during the sale, you need to find someone to sell you some CLN. You can try [etherdelta](https://etherdelta.com/) or [forkdelta](https://forkdelta.github.io/), they are decentralize exchanges so we advice you to have a solid understanding of what thay are before usage. Also, I suppose you already done this tutorial at least once if you intent to use it on Mainnet :smile:. So for Mainnet you can skip to the next section.

On Testnet ColuLocalNetworkSale contract implemented differently. The sale is open for 10 years, everyone can paricipate (no whitelisisting), and the tokens are immediately transfable. So let's get us some tCLN (test CLN)!

We need do send some tETH to the ColuLocalNetworkSale contract address, we're basically repeating the crowdsale process. If you don't have tETH you can obtain it through this [faucet](http://faucet.ropsten.be:3001/).

 So I open MyEtherWallet and send 1 tETH to `0x12321Fb3e2548b03eaD42F09cAb239cff377b4e2`, setting the gas limit to 120000 (the account balance should be more than 1 tETH cause the sender also pays for gas). Follow the transaction until it confirmed by the network.

 Opening the the transaction in etherscan, I see that I actually got 8600 CLN for 1 Ether (This is the price defined by the sale contract). For example you can see my transaction is [here](https://ropsten.etherscan.io/tx/0x249aaa9bccd902cc329a6c220e562578d235f054803e61dc4622fe19acf6a564). If you don't remember your TxHash (transaction id), you can view the [sale contract](https://ropsten.etherscan.io/address/0xa973fa1cf412ac6a76c749aa6e1fca7251814a48#tokentxns). For convenience, I am also adding the tCLN token as custom token in MyEtherWallet so I'll see it in my Token Balances, read about it  [here](https://myetherwallet.github.io/knowledge-base/send/adding-new-token-and-sending-custom-tokens.html) (the Decimals field should be 18 if you wonder).


 ## CC issuance with CurrencyFactory

 Now let's proceed to really interesting stuff of creating a Community Currency. We are going to do this by interacting with the `CurrencyFactory`, one of contracts created by Colu for currency issuance.

 In MyEtherWallet I go to the "Contracts" tab, and fill the contracts address. Then I need to get contract's ABI ([WTF is ABI?](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI)). All of our contracts are verified on Etherscan, so they contain their ABI's in the "Contract Source" tab. I search `CurrencyFactory` address in Etherscan, and copy the ABI from there to paste it in MyEtherWallet "ABI / JSON Interface" field. Pressing "Access" I can select any of the contract's function, the fields I need to fill are generated accordingly. MyEtherWallet knows how to do this thanks to the ABI we provided.

You can go over the functionality in MyEtherWallet, or read the [reference](reference/CurrencyFactory.md) in our docs. The reference also also contains developers comments, and we will improve it as time goes by. But we're here to issuance out Community Currency, so let's proceed.

The function to issue a currency is called, not surprisingly, `createCurrency`. You need to specify four parameters to call it: `name`, `symbol`, `decimals` and `totalSuply`. They all are part of the [ERC20](https://theethereum.wiki/w/index.php/ERC20_Token_Standard) token standart. Yes, all currencies issued by CLN contracts are standart ERC20 tokens (and [ERC667](https://github.com/ethereum/EIPs/issues/677) also). Generally, this means that they can be easily added and used by any ERC20 wallet.

- I call my currency `LeonCoin`
- Set the symbol accordingly to `LC`
- Define decimals to 18 (this is a standard).
- Total suply is the only field that tricky, let's define in to 100 * 10 ^ 18 = 100000000000000000000. This means that 100 `LC` coins will be created and no more.

I click on "WRITE". You don't send ETH to any of CLN contracts, so I set the ammount to send to 0, and the Gas Limit to 200000. Checking again that I'm on the right network I click Yes.

This is my [transaction](https://ropsten.etherscan.io/tx/0x5da028b5036da68bad1debe7db94c2c492c87a0f6da1422d58450c578ca692f1).
