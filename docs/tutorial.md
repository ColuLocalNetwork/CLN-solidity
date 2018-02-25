
# CLN Tutorial

This tutorial will guide you through the issuance, interaction, and exchange of community coins (CC). To follow this tutorial you should have a basic understanding of Ethereum and blockhain technologies. You can start from the [Ethereum wiki](https://github.com/ethereum/wiki/wiki/Ethereum-introduction) or this [awesome list](https://github.com/ethereum/wiki/wiki/Ethereum-introduction) of links currated by the community. This [overview](overview.md) gives a high level explanation of the CLN conracts, and a [contract reference](reference) provides a self generated documentation similar to REST API docs.

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

You can go over contract's functionality in MyEtherWallet, or read the [reference](reference/CurrencyFactory.md) in our docs. The reference also also contains developers comments, and we will improve it as time goes by. But we're here to issuance out Community Currency, so let's proceed.

The function to issue a currency is called, not surprisingly, `createCurrency`. You need to specify four parameters to call it: `name`, `symbol`, `decimals` and `totalSuply`. They all are part of the [ERC20](https://theethereum.wiki/w/index.php/ERC20_Token_Standard) token standard. Yes, all community currencies issued by CLN contracts are ERC20-compliant (and [ERC667](https://github.com/ethereum/EIPs/issues/677) also). Generally, this means that they can be easily added and used by any ERC20 wallet.

- I call my currency `LeonCoin`
- Set the symbol accordingly to `LC`
- Define decimals to 18 (this is the standard). This means that `LC` token will be devisible to 18 places after the dot.
- Total suply defines how much `LC` tokens will be issued. Let's define it to 100 * 10 ^ 18 = 100000000000000000000. This means that 100 "full" `LC` coins will be created, every token devisible up to 18 places.

I click on "WRITE". You don't send ETH to any of CLN contracts, so I set the ammount to send to 0, and the Gas Limit to 200000. Checking again that I'm on the right network I click Yes.

This is my [transaction](https://ropsten.etherscan.io/tx/0x5da028b5036da68bad1debe7db94c2c492c87a0f6da1422d58450c578ca692f1). Looking closely into it you can see that:

- The transaction sent from my account ([0x0d4df041db](https://ropsten.etherscan.io/address/0x0d4df041dbef6ffc0e444a4a213774adb0c118c2)) to the `CurrencyFactory`.
- The internal invoked contract is the new community currency. It says that 100 `LC` (the total suply) got transfered from `CurrencyFactory` to some [unknown contract](https://ropsten.etherscan.io/token/0x65d7070db3ffe6dbd7e53d5469b1b48fa33c6af7?a=0xf78703215ed962647478339fd54f785e1c95259a).

So what happened here?

- Currency Factory created the CC, as the token creator the currency factory made the owner of all the suply.
- Currency Factory created the Market Maker, that's the unkown contract we saw! Market Maker is used to exchange CLN/CC. More about it latter.
- Currency Factory moved all CC suply to the Market Maker. As an exchange provider it's reasonable that the MM will hold all the CC.

Nice, we created a currency but all of it is locked in some Market Maker. We should send CLN to get us some of that crypto-dough. But if we just send CLN to the Market Maker he will not have a slicest idea what we want. It will be hard to get this money back, so **don't** do this. Instead, there is two functions on the Currency Factory that designed exactly for that - `insertCLNtoMarketMaker` and `extractCLNfromMarketMaker`, we need the former.

Before calling this function I need to approve Currency Factory to use my CLN tokens. It's like saying to CLN contract: "Hey contract, if someone named CurrencyFactory will try to use my tokens, it's ok, I approve this". This is a ERC20 mechanism.

 Remeber how we called `createIssuance`? Now we'll do the same with the `ColuLocalNetwork` token. After uploading the ABI I'll call approve function with 1000 * 10 ^ 18 = 1000000000000000000000 (1000 CLN) as value and `CurrencyFactory` address as the spender. I checked everything is correct and click send.

 After the approve transaction is confirmed I can eventually call `insertCLNtoMarketMaker`. I do the same process again, this time for `CurrencyFactory`, after ABI is loaded I select `insertCLNtoMarketMaker` function. There's actually two functions with the same name (this is Solidity's function overloading feature), and I need the one that received both `token` and `clnAmount`. Maybe we talk latter about the second one. In the token field I paste the `LeonCoin`'s address, and put the same 1000 * 10 ^ 18 for the ammount field.

Viewing the [transaction](https://ropsten.etherscan.io/tx/0xaadef80fdbb2dc223a0c780e2d4444b0a8ec9642a1496970653f681bfa73c966) you may think some complex stuff happened there. Well, I'll try to sum it up.

- `CurencyFactory` transfers the CLN to itself. He can do it cause I gave him an allowance for this before.
- Then he transfers the tokens to Marker Maker letting him do his mathematical magic. More techically speaking he approves `MM` to use `CLN`, and calls `MM`'s  `change` function.
- In return the `CurencyFactory` receives `LC` tokens.
- He sends the tokens back to the sender.

As you see, `Currency Factory` It's really just an intermediary that calls `Marker Maker` and holds some data about issuances. Now I'll add my `LC` token to MyEtherWallet, so I can easily see my tokens. I encourage you to do this with your Community Currency also, just for fun as I say.

You can call `insertCLNtoMarketMaker` multiple times, exchanging more CLN for your home-baked Community Currency. By the way did you noticed that the CLN/CC exchange rate changes? This is because as you change more CLN to CC, your CC becomes more valuable and so It's price grows. That's how Market Maker works, we'll get into it in the second part of the tutorial.

You call `extractCLNfromMarketMaker` to get your CLN back. If you exhcange all you CC to CLN you'll get the innitial CLN ammount, no CLN lost.

Only token issuer can call `insertCLNtoMarketMaker` and `extractCLNtoMarketMaker`. For everyone else to be able to exchange CLN/CC we need to open the CC's Market Maker for public usage. Why this is done? So the issuer will have sufficient time for various prepations to make the new currency usable, like inserting enough CLN or even do something not related to crypto.. Then when he's ready he releases the new currency to the world.

That's what we are doing last. Let's call the function `openMarket` of the `CurrencyFactory`, giving it `CC`'s address as the argument. After the transaction is confirmed anyone can use the Marker Maker contract.
