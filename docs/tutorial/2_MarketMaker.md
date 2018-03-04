# Mechanical Market Maker

## Concept Introduction

So what is a market maker, or should we say who is this? Let's look into [wikipedia](https://en.wikipedia.org/wiki/Market_maker):

>A market maker or liquidity provider is a company or an individual that quotes both a buy and a sell price in a financial instrument or commodity held in inventory, hoping to make a profit on the bid-offer spread, or turn

Maybe some of the readers are proficient in economy or the stock market, but I suppose some are not. So before writing about Colu's `EllipseMarketMaker` I'd like to explain this broad definition.

To "quote" just means to give a specific price for a commodity, and the market maker gives both buy and sell price. Economics are hard to explain, so instead I'll give a simple example of a market maker, I'm sure everyone is acquaintance with - The Dollar/Other currency exchange booth. When I traveled to Mexico I used multiple of them along the country to trade my dollars to pesos, every of them got a different exchange rate and it was kind of hard to find an optimal one. You can read more about [spread](https://en.wikipedia.org/wiki/Bid%E2%80%93ask_spread), but I guess you can imagine how these guys make money.

Giving both sell and buy prices is what makes the asset tradable. In ecomomincs it is called [liquidity](https://www.investopedia.com/terms/l/liquidity.asp)

> Degree to which an asset or security can be quickly bought or sold (Investopedia)

Currencies and stocks got high liquidity that supported by various market players, it's very fast to exchange them. Real estate liquidity is much lower, for example it takes much more effort to sell a house. To be useful, currency should have a superb liquidity, and there's were community currencies in general fail. A community currency got a limited amount of holders by it's definition. As you saw in the [previous part](1_CurrencyFactory.md) it can be just the issuer.

It was a crucial issue to solve to make the local economy running. So the autonomous liquidity provider, or how we call it - a Mechanical Market Maker, was initiated. Mechanical Market Maker provides immediate exchange between CLN and the Community Currency, while the exchange rate is calculated from a mathematical formula. We're not the only one in the autonomous liquidity domain, with the evolution of smart contracts many others, like [Bancor](https://www.bancor.network/) or [Stablecoin](http://cdetr.io/smart-markets/), presented their ideas, formulas and liquidity providers. Though every technology must be viewed in the context of the solution it provides. Infinite number of formulas are possible, but our aim was to conceive one that assist in development of local communities.


## Getting Back Technical

After such an introduction, let's talk technical again. In the last chapter we issued a new currency and exchanged CLN to CC calling `insertCLNtoMarketMaker`. Do you remember that [transaction](https://ropsten.etherscan.io/tx/0x350fe7bad490baa8a0446c8f5f76bb913b8238fcd882832bb7b4b3e354d1b9c6)? Here I exchanged 1000 CLN for ~1339 CC. But if you have created your currency with a different supply, the exchange rate is going to be different too. For example Mark [created](https://etherscan.io/tx/0xe444c7b274e937bf97484d480c6eb5d0859e5754164ea911c68138280364234d) a currency with a total supply of 10,000 so when he [inserted](https://etherscan.io/tx/0xb565b4f820efd0298158d023a43ef28b9cfc5caf62b4a1fc17bf0169a324003f) 100 CLN he received only ~3 TAC (his Community Currency). Then he asked me why he got only 3 TAC for 100 CLN. We dive soon into that, but the intuition here is because his currency has much smaller supply, every TAC token is much more valuable than my CC.

At the last chapter we eventually open the market for public. As a recap let's explore `CurrencyFactory` through Etherscan's read contracts [tab](https://ropsten.etherscan.io/address/0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59#readContract). Here you see contract's data and the view functions that can be called because they don't mutate contract's state. My CC address is `0x8611c307F3b88040Aa4E73E8e2c5DB303ca81701`, let's see if `CurrencyFactory` supports this token. I fill this address in the fields next to `supportsToken` function and press query. Here how it looks:

![etherscan_read](../assets/etherscan_read.png)

You can see that the answer for `supportsToken` is `true`. So we're good. All the tokens that created using the `CurrencyFactory` are supported, and also CLN. After that I put the same address and query the `currencyMap`, you can see above the results. I can get assured that this is indeed the currency I created cause I'm the owner.

This is also a quick way to get MarkerMaker address, it appears as `mmAddress` field. I created a new Ethereum [account](https://ropsten.etherscan.io/address/0x28ef70800b19b3bf15bf8210f351a95f15613aeb) and transferred some CLN and Ether. While my first account was the token issuer, that one represents a community member.

Now let's interact directly with the `MarketMaker` contract. Opening the contract in Etherscan I see it's not verified and there was no ABI in the "Contract Code" tab, just the bytecode. But if we remember the first part, that contract was created by the `CurrencyFactory` when I created the Community Currency. So we can't expect every Market Maker or Community Currency contract to be verified.

Fortunately, all the logic of this `MarkerMaker` is in the [EllipseMarketMakerLib](../reference/EllipseMarketMakerLib.md) contract. Every concrete `MarketMaker` holds data that related to the concrete Community Currency, but uses the logic of `EllipseMarketMakerLib` to calculate the exchange rate. This makes creation of new currencies relatively inexpensive, because less logic in contract means less data, means less fees. In particular, this means that we can take the ABI of `EllipseMarketMakerLib` [contract](https://ropsten.etherscan.io/address/0x30724fa809d40330eacab9c7ebcfb2a0058c381c) to send transactions to our concrete `MarketMaker`. Here's a screenshot to bear the confusion you might have:

![mew_MarketMaker](../assets/mew_MarketMaker.png)

Also you can see that I call contract's function  `openForPublic`, to be sure that I can exchange CLN/CC through this contract. I don't need to send a transaction because it's a `view` (read-only) function, but we already used `view` functions before when we interacted with `CurrencyFactory` on Etherscan. They are using Ethereum's [JSON-RPC](https://github.com/ethereum/wiki/wiki/JSON-RPC) and don't get propagated to every node, so there's no Gas to pay.

Another `view` function I want to try is `getCurrentPrice`, calling it I get an answer of 569672901914775677. This means that for 1 CLN we get 569672901914775677 / 1e18 = ~0.57 CC. It's a bit clumsy, but was implemented that way because Solidity's lacking support of real numbers.


Just like we did in part 1, we need to approve `MarketMaker` to use CLN. I call `approve` function of [[ColuLocalNetwork](../reference/ColuLocalNetwork.md) contract, fill in the amount I wish to exchange and specify `MarketMaker` address as the spender. Investigating [transaction's](https://ropsten.etherscan.io/tx/0x4d59b4e0dfe3e853e94e0515bda6a0cac921b5db54ad52b2edf950d7c1c574d4) arguments you can see that the first one is my `MarketMaker` address - `000000000000000000000000b3f9a85d00fcb75be507da5efc0b91ed221e9bb9` and the second is the amount in hex (0xde0b6b3a7640000 = 1e18).


The function that exchanges CLN/CC is called, surprisingly, `change`. There's multiple implementations with different arguments, I choose one that takes 3 arguments:
-  `_fromToken` is [ColuLocalNetwork](../reference/ColuLocalNetwork.md) address.
-  `_inAmount` in the amount of CLN tokens I want to exchange (in that context).
-  `_toToken` is the address of my `CommunityCurrency`

![mew_change](../assets/mew_change.png)

Let's sign and send the transaction. Oh, look at [that](https://ropsten.etherscan.io/tx/0x9e3ef01e47e4a1d6af4d1fbcbcca6f0b7ed287476bddd7a26c174e97ae68788d), I did receive ~0.57 CC in exchange of 1 CLN.

Let's check again the CLN/CC exchange rate, I call `getCurrentPrice` again and get a slightly different price! It returns now 569388278636115886, the delta is 569672901914775677 - 569388278636115886 = 284623278659791. We need to divide by 1e18, so it gives a change of 0.00028. This means that now we receive less CC for CLN, that's the Mechanical Market Maker in action. It's small, but we see that our CC it's getting more expensive.

The most observant of you might noticed that in the last transaction I exchanged 1 CLN for 0.56953055471532534 CC. Let's multiply it by 1e18 to align with other values. 0.56953055471532534 * 1e18 = 569530554715325340, I call this `actualRate`. Then:

> 569672901914775677 > 569530554715325340 > 569388278636115886

> getCurrentPrice_before > actualRate > getCurrentPrice_after

This means that the exchange rate of CLN/CC defined continuously for every wei, and it changes with every wei that got inserted (or extracted) into Market Maker.

To know exactly how much CLN for CC (and vice versa) you get, there's a `quote` function. This is also a read-only function, and it's like `getCurrentPrice` but for an amount of CLN. Let's say I want to buy 1000 CLN (1e21), I'll do.

![mew_quote](../assets/mew_quote.png)

471765614363247798186 / 1e18 = ~471.76. It means that now for 1000 CLN I'm getting ~476 CC. Do you remember that in the first part I got 1139 CC for 1000 CLN? Well, that's a pretty rough rate change.

Now after I know for sure how much CC I'll get for 1000 CLN, let's do the trade. But what if between that time when I checked quote and called `change` function, someone other called changed before me? I'll get different CC amount! Sometime It can be more (which is good), but sometimes less. Do I'm ok with less? If yes how much less I'm ok with? Of course this difference is significant only on some edge cases, but we got that too covered.

First, let's approve that 1000 CLN for the `MarkerMaker`. After this is done we are going to call different implementation of `change`. One that receives 4 arguments, 3 of them are the same and `minReturn` is the new one. With this argument I specify what is the minimum amount of tokens I agree to receive in return. If the exchange rate changed and I'm going to receive less than `minReturn`, the deal got canceled and the transaction is reverted. I just pay for the Gas.
