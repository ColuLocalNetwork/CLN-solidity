## Acquiring CLN

For Mainnet, if you didn't get some tokens during the sale, you need to find someone to sell you some CLN. You can try [etherdelta](https://etherdelta.com/), [forkdelta](https://forkdelta.github.io/) or [ddex.io](https://ddex.io/), they are decentralized exchanges so we advice you to have a solid understanding of them before usage. Also, I suppose you already done this tutorial at least once if you intend to use it on Mainnet :smile:. So for Mainnet you can skip to the next section.

On Testnet `ColuLocalNetworkSale` contract is implemented differently. The crowdsale is open for 10 years, everyone can participate (no whitelisting), and the tokens are immediately transferable. So let's get us some tCLN (test CLN)!

We are basically repeating the crowdsale process, so we need to send some tETH to the `ColuLocalNetworkSale` contract address. If you don't have tETH you can obtain it through this [faucet](http://faucet.ropsten.be:3001/) or [this one](https://faucet.bitfwd.xyz/). I did it twice.

 I open MyEtherWallet and send 1 tETH to `0xa973fa1cF412AC6A76C749aA6E1fcA7251814A48`, setting the gas limit to 120000 (the account balance should be more than 1 tETH cause the sender also pays for gas). Follow the transaction until it's confirmed by the network.

 Opening the transaction in Etherscan, I see that I actually got 8600 CLN for 1 Ether (This is the price defined by the sale contract). You can see my transaction [here](https://ropsten.etherscan.io/tx/0x249aaa9bccd902cc329a6c220e562578d235f054803e61dc4622fe19acf6a564). If you lost your TxHash (transaction id), you can view the [sale contract](https://ropsten.etherscan.io/address/0xa973fa1cf412ac6a76c749aa6e1fca7251814a48#tokentxns). Also, For convenience, I am adding the CLN token as custom token in MyEtherWallet so I'll see it in my Token Balances. Read about it  [here](https://myetherwallet.github.io/knowledge-base/send/adding-new-token-and-sending-custom-tokens.html), the Decimals field should be 18 if you wonder.
