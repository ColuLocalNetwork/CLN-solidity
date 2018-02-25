
# CLN Tutorial

This tutorial will guide you through the issuance, interaction, and exchange of Community Currenies (CC). To follow this tutorial you should have a basic understanding of Ethereum and blockhain technologies. You can start from the [Ethereum wiki](https://github.com/ethereum/wiki/wiki/Ethereum-introduction) or this [awesome list](https://github.com/ethereum/wiki/wiki/Ethereum-introduction) of links currated by the community. This [overview](overview.md) gives a high level explanation of the CLN conracts, and a [contract reference](reference) provides a self generated documentation similar to REST API docs.

From a practical side you will need an ERC20 compatible wallet to send and sign transactions. I will use [MyEtherWallet](https://www.myetherwallet.com/) because of his abillity to generate transactions from ABI. Also of course you will need ETH to pay for gas, and CLN to interact with contracts of Colu Local Network. You can learn more about the relation of CLN and Community Currenies (CC) from the [whitepapper](https://cln.network/pdf/cln_whitepaper.pdf).

To proceed with this guide I created a new Ethereum account - [0x0d4DF041Dbef6fFC0E444a4a213774AdB0c118C2](https://ropsten.etherscan.io/address/0x0d4DF041Dbef6fFC0E444a4a213774AdB0c118C2). I'm going to perform all the action on Ropsten Test Network, so you can follow. We encourage you first to use testnet untill a sufficient understanding of the CLN contracts is achieved.

## Contract Addresses

#### Ropsten Test Network
- [ColuLocalNetwork](reference/ColuLocalNetwork.md) -  [0x41c9d91e96b933b74ae21bcbb617369cbe022530](https://ropsten.etherscan.io/address/0x41c9d91e96b933b74ae21bcbb617369cbe022530)
- [ColuLocalNetworkSale](reference/ColuLocalNetworkSale.md) - [0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48](https://ropsten.etherscan.io/address/0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48)
- [CurrencyFactory](reference/CurrencyFactory.md) - [0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59](https://ropsten.etherscan.io/address/0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59)
- [IssuanceFactory](reference/IssuanceFactory.md) - [0xd352492ebeb9fad92147a3719766d7afe38fe26e](https://ropsten.etherscan.io/address/0xd352492ebeb9fad92147a3719766d7afe38fe26e)
- [EllipseMarketMakerLib](reference/EllipseMarketMakerLib.md) - [0x30724fa809d40330eacab9c7ebcfb2a0058c381c](https://ropsten.etherscan.io/address/0x30724fa809d40330eacab9c7ebcfb2a0058c381c)


#### Main Network

- [ColuLocalNetwork](reference/ColuLocalNetwork.md) - [0x4162178B78D6985480A308B2190EE5517460406D](https://etherscan.io/address/0x4162178b78d6985480a308b2190ee5517460406d)
- [ColuLocalNetworkSale](reference/ColuLocalNetworkSale.md) - [0x12321Fb3e2548b03eaD42F09cAb239cff377b4e2](https://etherscan.io/address/0x12321fb3e2548b03ead42f09cab239cff377b4e2)
- [CurrencyFactory](reference/CurrencyFactory.md) - [0x21851f9970e333cbc253ba2c7ef953219c479ab7](https://etherscan.io/address/0x21851f9970e333cbc253ba2c7ef953219c479ab7)
- [IssuanceFactory](reference/IssuanceFactory.md) - [0xe3444f1aac1a37b8cce47db260d1c6e25a2f627b](https://etherscan.io/address/0xe3444f1aac1a37b8cce47db260d1c6e25a2f627b)
- [EllipseMarketMakerLib](reference/EllipseMarketMakerLib.md) - [0xc70636e0886eC4a4F2B7e42aC57ccD1B976352d0](https://etherscan.io/address/0xc70636e0886ec4a4f2b7e42ac57ccd1b976352d0)


## Acquiring CLN

For Mainnet, if you didn't get some tokens during the sale, you need to find someone to sell you some CLN. You can try [etherdelta](https://etherdelta.com/) or [forkdelta](https://forkdelta.github.io/), they are decentralize exchanges so we advice you to have a solid understanding of them before usage. Also, I suppose you already done this tutorial at least once if you intent to use it on Mainnet :smile:. So for Mainnet you can skip to the next section.

On Testnet `ColuLocalNetworkSale` contract implemented differently. The crowdsale is open for 10 years, everyone can participate (no whitelisisting), and the tokens are immediately transferable. So let's get us some tCLN (test CLN)!

We are basically repeating the crowdsale process, so we need do send some tETH to the `ColuLocalNetworkSale` contract address. If you don't have tETH you can obtain it through this [faucet](http://faucet.ropsten.be:3001/). I did this twice.

 I open MyEtherWallet and send 1 tETH to `0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48`, setting the gas limit to 120000 (the account balance should be more than 1 tETH cause the sender also pays for gas). Follow the transaction until it confirmed by the network.

 Opening the transaction in etherscan, I see that I actually got 8600 CLN for 1 Ether (This is the price defined by the sale contract). You can see my transaction [here](https://ropsten.etherscan.io/tx/0x249aaa9bccd902cc329a6c220e562578d235f054803e61dc4622fe19acf6a564). If you lost your TxHash (transaction id), you can view the [sale contract](https://ropsten.etherscan.io/address/0xa973fa1cf412ac6a76c749aa6e1fca7251814a48#tokentxns). For convenience, I am also adding the CLN token as custom token in MyEtherWallet so I'll see it in my Token Balances. Read about it  [here](https://myetherwallet.github.io/knowledge-base/send/adding-new-token-and-sending-custom-tokens.html), the Decimals field should be 18 if you wonder.


 ## CC issuance with CurrencyFactory

 Now let's proceed to really interesting stuff of creating new Community Currency. We are going to do this by interacting with the `CurrencyFactory`, one of the contracts created by Colu for currency issuance.

 In MyEtherWallet I go to the "Contracts" tab, and fill the contracts address. Then I need to get contract's ABI ([WTF is ABI?](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI)). All of Colu's contracts are verified on Etherscan, so they contain their ABI's in the "Contract Source" tab. I search `CurrencyFactory` address in Etherscan, and copy the ABI from there to paste it in MyEtherWallet "ABI / JSON Interface" field. Pressing "Access" I can select any of the contract's function and the fields to fill are generated accordingly. MyEtherWallet knows how to do this thanks to the provided ABI.

 This is how it looks at Etherscan:

 ![abi](assets/abi.png)

You can go over contract's functionality in MyEtherWallet, or read the [reference](reference/CurrencyFactory.md) in our docs. The reference also also contains developers comments, and we will improve it as time goes by. But we're here to issuance out Community Currency, so let's proceed.

The function to issue a currency is called, not surprisingly, `createCurrency`. You need to specify four parameters to call it: `name`, `symbol`, `decimals` and `totalSuply`. They all are part of the [ERC20](https://theethereum.wiki/w/index.php/ERC20_Token_Standard) token standard. Yes, all community currencies issued by CLN contracts are ERC20-compliant (and [ERC667](https://github.com/ethereum/EIPs/issues/677) also). Generally, this means that they can be easily added and used by any ERC20 wallet.

- I call my currency `CommunityCurrency`
- Set the symbol accordingly to `CC`
- Define decimals to 18 (this is the standard). This means that `CC` token will be devisible to 18 places after the dot.
- Total suply defines how much `CC` tokens will be issued. Let's define a total supply of one million tokens, 1e6 * 1e18 = 1000000000000000000000000. This means that one million "full" `CC` coins will be created, every token devisible up to 18 places.


This is how it looks at MyEtherWallet:

![mew](assets/mew.png)

I click on "WRITE". You don't send ETH to any of CLN contracts, so I set the ammount to send to 0, and the Gas Limit to 200000. Checking again that I'm on the right network I click Yes.

This is my [transaction](https://ropsten.etherscan.io/tx/0x83e96a696110172da2cf7d0afa11bd7415f6737dbbd51d3055ac609cfe12b206). Looking closely into it you can see that:

- The transaction sent from my account ([0x0d4df041db](https://ropsten.etherscan.io/address/0x0d4df041dbef6ffc0e444a4a213774adb0c118c2)) to the `CurrencyFactory`.
- The internal invoked contract is the new Community Currency. It says that 1000000 `CC` (the total suply) got transfered from `CurrencyFactory` to some [unknown contract](https://ropsten.etherscan.io/address/0xb3f9a85d00fcb75be507da5efc0b91ed221e9bb9).
- My Community Currency contract address is [0x8611c307F3b88040Aa4E73E8e2c5DB303ca81701](https://ropsten.etherscan.io/address/0x8611c307f3b88040aa4e73e8e2c5db303ca81701), save address of your Community Currency cause we're going to use it soon.

So what happened here?

- Currency Factory created the CC, as the token creator the currency factory made the owner of all the suply.
- Currency Factory created the Market Maker, that's the unkown contract we saw! Market Maker is used to exchange CLN/CC. More about it latter.
- Currency Factory moved all CC suply to the Market Maker. As an exchange provider it's reasonable that the MM will hold all the CC.

Nice, we created a currency but all of it is locked in some Market Maker. We should send CLN to get us some of that crypto-dough. But if we just send CLN to the Market Maker he will not have a slicest idea what we want. It will be hard to get this money back, so **don't** do this. Instead, there is two functions on the Currency Factory that designed exactly for that - `insertCLNtoMarketMaker` and `extractCLNfromMarketMaker`, we need the former.

Before calling this function I need to approve Currency Factory to use my CLN tokens. It's like saying to CLN contract: "Hey contract, if someone named CurrencyFactory will try to use my tokens, it's ok, I approve this". This is a ERC20 mechanism.

 Remeber how we called `createIssuance`? Now we'll do the same with the `ColuLocalNetwork` token. After uploading the ABI I'll call approve function with 1000 * 1e18 = 1000000000000000000000 (1000 CLN) as value and `CurrencyFactory` address as the spender. I check everything is correct and click send. Easy, the only thing to know about approve, that if you already approved some amount and you want to change it, you need first to set allowance  to zero and then send approve again with the new value ([more info](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#approve )).

 After the approve transaction is confirmed I can eventually call `insertCLNtoMarketMaker`. I do the same process again, this time for `CurrencyFactory`, after ABI is loaded I select `insertCLNtoMarketMaker` function. There's actually two functions with the same name (this is Solidity's function overloading feature), and I need the one that received both `token` and `clnAmount`. Maybe we talk latter about the second one. In the token field I paste the `CommunityCurrency`'s address, and put the same 1000 * 1e18 for the ammount field.

Viewing the [transaction](https://ropsten.etherscan.io/tx/0x350fe7bad490baa8a0446c8f5f76bb913b8238fcd882832bb7b4b3e354d1b9c6) you may think some complex stuff happened there. Well, I'll try to sum it up.

- `CurencyFactory` transfers the CLN to itself. He can do it cause I gave him an allowance for this before.
- Then he transfers the tokens to Marker Maker letting him do his mathematical magic. More techically speaking he approves `MM` to use `CLN`, and calls `MM`'s  `change` function.
- In return the `CurencyFactory` receives `CC` tokens.
- He sends the tokens back to the sender.

As you see, `Currency Factory` It's really just an intermediary that calls `Marker Maker` and holds some data about issuances. The bottom line is I've got around 1,139 `CC` for 1000 `CLN`. Now I'll add my `CC` token to MyEtherWallet, so I can easily see my tokens. I encourage you to do this with your Community Currency also, just for fun as I say.

You can call `insertCLNtoMarketMaker` multiple times, exchanging more CLN for your home-baked Community Currency. By the way did you noticed that the CLN/CC exchange rate changes? This is because as you exchange more CLN for CC, your CC becomes more valuable and so It's price grows. That's how Market Maker works, we'll get into it in the second part of the tutorial.

You call `extractCLNfromMarketMaker` to get your CLN back. If you exchange all you CC to CLN you'll get the innitial CLN ammount, no CLN lost.

Only token issuer can call `insertCLNtoMarketMaker` and `extractCLNtoMarketMaker`. For everyone else to be able to exchange CLN/CC we need to open the CC's Market Maker for public usage. This is done to give sufficient time for the currency issuer. As I explained before CLN/CC rate depends on the CC demand. When the token just created the demand for CC is low, so the currency issuer has an advantage to buy CLN for a cheapest price. Other preparations might not be related to crypto at all.

When issuer is ready he releases the Community Currency to the world. Let's call the function `openMarket` of the `CurrencyFactory`, giving it `CC`'s address as the argument. After the [transaction](https://ropsten.etherscan.io/tx/0x5e86f8ab823098065f7e6c172e3b3f9baaea280c9125d56b6639b7b666d8fe18) is confirmed anyone can use the Market Maker contract, and the issuer has no advantage to other participants. We will learn more about Marker Maker functions and internal mechanins in the second part of this tutorial.
