
# CLN smart contracts overview

## [ColuLocalNetwork](reference/ColuLocalNetwork.md)

ColuLocalNetwork is the CLN Token, used for curency issuance, mechanical market marking, and in other contracts of the Colu network. It's a ERC20 token that supports both ERC223 and ERC677 standarts.


 ## [CurrencyFactory](reference/CurrencyFactory.md)

CurrencyFactory provides a simple mechanism for creation of community currencies. With this contract a sole issuer creates a currency that backed by CLN tokens from issuer's funds  as a reservoir. Ammount of the CLN tokens in reservoir affects the price of new currency. When desired price (or CLN reservoir) is reached the issuer can open the mechanical market maker for public. After that anyone can change their CLN tokens to the new community currency and vice versa. Refer to EllipseMarketMaker for more information.



## [IssuanceFactory](reference/IssuanceFactory.md)
IssuanceFactory provides a crowdfunding mechanism for creation of community currencies. With this contract an issuer provides a desired price in CLN and a duration of the crowdfunding event. Based on the desired price the market maker defines a CLN sofcap that should be collected during the crowdfunding. This sofcap represents the reservoir needed to back up the desired price. Anyone can participate in the currency issuance, sending CLN to the contract and getting the community currency in return. After the crowdfunding period two outcomes are possible.
- The issuance is successfull if the softcap is reached. The community currency is created! For now on every one can exchange CLN/CC through the mechanical market maker. The currency issuer is able to take the difference between CLN raised and.
- The issuance is failed if sofcap isn't reached. The marker maker remains closed, and no further interactions with the failed currency are possible. All the participants can refund their CLN.


 ## [EllipseMarketMaker](reference/EllipseMarketMaker.md)

EllipseMarketMaker is the core logic of CLN's market making. This is an autonomous market marker, providing instance liquidity for CLN/CC exchange. For more information and mathematical formulas see the appendix of the [white papper](https://cln.network/pdf/cln_whitepaper.pdf).
