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

At the last chapter we eventually open the market for public. As a recap let's explore `CurrencyFactory` through Etherscan's read contracts [tab](https://ropsten.etherscan.io/address/0x7b2cbec58653aaf79842b80ed184b2ecb4e17d59#readContract). Here you see contract's data and the view functions that can be called because they don't mutate contract's state. My CC address is `0x8611c307F3b88040Aa4E73E8e2c5DB303ca81701`, let's see if `CurrencyFactory` supports this token. I fill this address in the fields next to `supportsToken` function and press query. It supposed to be no screenshot tutorial but because it's the first time I use this tab, I'm providing one :smile:

![etherscan_read](../assets/etherscan_read.png)

You can see that the answer for `supportsToken` is `true`. So we're good. All the tokens that created using the `CurrencyFactory` are supported, and also CLN. After that I put the same address and query the `currencyMap`, you can see above the results. I can get assured that this is indeed the currency I created cause I'm the owner.

This is also a quick way to get MarkerMaker address, it appears as `mmAddress` field. I created a new Ethereum [account](https://ropsten.etherscan.io/address/0x28ef70800b19b3bf15bf8210f351a95f15613aeb) and transferred some CLN and Ether. While my first account was the token issuer, that one represents a community member.

 Now let's interact directly with the `MarketMaker` contract.
