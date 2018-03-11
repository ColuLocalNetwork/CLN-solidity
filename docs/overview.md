
# CLN smart contracts overview

## [ColuLocalNetwork](reference/ColuLocalNetwork.md)

ColuLocalNetwork is the CLN Token, used for currency issuance, mechanical Market Making, and in other contracts of the Colu network. It's an ERC20 token that supports both ERC223 and ERC677 standards.


 ## [CurrencyFactory](reference/CurrencyFactory.md)

The CurrencyFactory provides a simple mechanism for the creation of community currencies. With this contract a sole issuer creates a currency, that is backed by CLN tokens, from the issuer's funds as a reservoir. The amount of CLN tokens in the reservoir affects the price of the new currency. When the desired price (or CLN reservoir) has been reached the issuer can open the mechanical market maker to the public. After that anyone can change their CLN tokens to the new community currency and vice versa. Refer to the EllipseMarketMaker for more information


## [IssuanceFactory](reference/IssuanceFactory.md)
IssuanceFactory provides a crowdfunding mechanism for creation of community currencies. With this contract an issuer provides a desired price in CLN and a duration of the crowdfunding event. Based on the desired price the market maker defines a CLN soft cap that should be collected during the crowdfunding. This soft cap represents the reservoir needed to back up the desired price. Anyone can participate in the currency issuance, sending CLN to the contract and getting the community currency in return. After the crowdfunding period two outcomes are possible.
- The issuance is successful if the soft cap is reached. The community currency is created! For now on every one can exchange CLN/CC through the mechanical market maker. The currency issuer is able to take the difference between CLN raised and.
- The issuance is failed if soft cap isn't reached. The marker maker remains closed, and no further interactions with the failed currency are possible. All the participants can refund their CLN.


 ## [EllipseMarketMaker](reference/EllipseMarketMaker.md)

EllipseMarketMaker is the core logic of CLN's market making. This is an autonomous market marker, providing instance liquidity for CLN/CC exchange. For more information and mathematical formulas see the appendix of the [white papper](https://cln.network/pdf/cln_whitepaper.pdf).
