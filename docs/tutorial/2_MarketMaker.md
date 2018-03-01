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

After such an introduction, let's talk technical again.
