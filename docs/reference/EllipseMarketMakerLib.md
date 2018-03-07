* [EllipseMarketMakerLib](#ellipsemarketmakerlib)
  * [Accessors](#ellipsemarketmakerlib-accessors)
  * [Events](#ellipsemarketmakerlib-events)
    * [Change(*address* indexed `fromToken`, *uint256* `inAmount`, *address* indexed `toToken`, *uint256* `returnAmount`, *address* indexed `account`)](#changeaddress-indexed-fromtoken-uint256-inamount-address-indexed-totoken-uint256-returnamount-address-indexed-account)
    * [OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)](#ownershiprequestedaddress-indexed-_by-address-indexed-_to)
    * [OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)](#ownershiptransferredaddress-indexed-_from-address-indexed-_to)
  * [Functions](#ellipsemarketmakerlib-functions)
    * [supportsToken(*address* `_token`)](#supportstokenaddress-_token)
    * [requestOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestownershiptransferaddress-_newownercandidate)
    * [change(*address* `_toToken`)](#changeaddress-_totoken)
    * [initializeOnTransfer()](#initializeontransfer)
    * [calcReserve(*uint256* `_R1`, *uint256* `_S1`, *uint256* `_S2`)](#calcreserveuint256-_r1-uint256-_s1-uint256-_s2)
    * [constructor(*address* `_mmLib`, *address* `_token1`, *address* `_token2`)](#constructoraddress-_mmlib-address-_token1-address-_token2)
    * [isOpenForPublic()](#isopenforpublic)
    * [acceptOwnership()](#acceptownership)
    * [withdrawExcessReserves()](#withdrawexcessreserves)
    * [initializeAfterTransfer()](#initializeaftertransfer)
    * [change(*address* `_fromToken`, *uint256* `_inAmount`, *address* `_toToken`, *uint256* `_minReturn`)](#changeaddress-_fromtoken-uint256-_inamount-address-_totoken-uint256-_minreturn)
    * [quote(*address* `_fromToken`, *uint256* `_inAmount`, *address* `_toToken`)](#quoteaddress-_fromtoken-uint256-_inamount-address-_totoken)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)
    * [getPrice(*uint256* `_R1`, *uint256* `_R2`, *uint256* `_S1`, *uint256* `_S2`)](#getpriceuint256-_r1-uint256-_r2-uint256-_s1-uint256-_s2)
    * [change(*address* `_fromToken`, *uint256* `_inAmount`, *address* `_toToken`)](#changeaddress-_fromtoken-uint256-_inamount-address-_totoken)
    * [change(*address* `_toToken`, *uint256* `_minReturn`)](#changeaddress-_totoken-uint256-_minreturn)
    * [openForPublicTrade()](#openforpublictrade)

# EllipseMarketMakerLib

### Ellipse Market Maker Library.

- **Author**: Tal Beja.
- **Constructor**: EllipseMarketMakerLib()
- This contract does **not** have a fallback function.

## EllipseMarketMakerLib Accessors

* *bool* operational() `0a401086`
* *address* token2() `25be124e`
* *address* mmLib() `63ddc54d`
* *uint256* S2() `65581793`
* *bool* validateReserves() `6e76a89f`
* *uint256* S1() `7826f28f`
* *address* owner() `8da5cb5b`
* *uint256* PRECISION() `aaf5eb68`
* *uint256* R1() `b22dd2ca`
* *address* newOwnerCandidate() `d091b550`
* *address* token1() `d21220a7`
* *uint256* getCurrentPrice() `eb91d37e`
* *bool* openForPublic() `eff3c4e7`
* *uint256* R2() `fee2cb05`

## EllipseMarketMakerLib Events

### Change(*address* indexed `fromToken`, *uint256* `inAmount`, *address* indexed `toToken`, *uint256* `returnAmount`, *address* indexed `account`)

**Signature hash**: `4a5c2d6efb7e2af02ed2dc99fe76b65b177b6e95d687b97317c3910f824f85cc`

### OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)

**Signature hash**: `13a4b3bc0d5234dd3d87c9f1557d8faefa37986da62c36ba49309e2fb2c9aec4`

### OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)

**Signature hash**: `8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0`

## EllipseMarketMakerLib Functions

### supportsToken(*address* `_token`)

- **State mutability**: `view`
- **Signature hash**: `061f7650`

returns true iff token is supperted by this contract (for erc223/677 tokens calls)

#### Inputs

| type      | name     | description                             |
| --------- | -------- | --------------------------------------- |
| *address* | `_token` | address adress of the contract to check |

#### Outputs

| type   |
| ------ |
| *bool* |

### requestOwnershipTransfer(*address* `_newOwnerCandidate`)

- **State mutability**: `nonpayable`
- **Signature hash**: `0952c504`

Proposes to transfer control of the contract to a newOwnerCandidate.

#### Inputs

| type      | name                 | description                                   |
| --------- | -------------------- | --------------------------------------------- |
| *address* | `_newOwnerCandidate` | address The address to transfer ownership to. |

### change(*address* `_toToken`)

- **State mutability**: `nonpayable`
- **Signature hash**: `1e77933e`

change tokens using erc223\erc677 transfer.

#### Inputs

| type      | name       | description      |
| --------- | ---------- | ---------------- |
| *address* | `_toToken` | the token to buy |

#### Outputs

| type      | name           | description                           |
| --------- | -------------- | ------------------------------------- |
| *uint256* | `returnAmount` | the return amount of the buying token |

### initializeOnTransfer()

- **State mutability**: `nonpayable`
- **Signature hash**: `3c3c88b1`

initialize the contract during erc223/erc677 transfer of all of the tokens form the pair

#### Outputs

| type   |
| ------ |
| *bool* |

### calcReserve(*uint256* `_R1`, *uint256* `_S1`, *uint256* `_S2`)

- **State mutability**: `pure`
- **Signature hash**: `6bfae928`

calculate second reserve from the first reserve and the supllies.formula: R2 = S2 * (S1 - sqrt(R1 * S1 * 2  - R1 ^ 2)) / S1the equation is simetric, so by replacing _S1 and _S2 and _R1 with _R2 we can calculate the first reserve from the second reserve

#### Inputs

| type      | name  | description             |
| --------- | ----- | ----------------------- |
| *uint256* | `_R1` | the first reserve       |
| *uint256* | `_S1` | the first total supply  |
| *uint256* | `_S2` | the second total supply |

#### Outputs

| type      | name  | description            |
| --------- | ----- | ---------------------- |
| *uint256* | `_R2` | _R2 the second reserve |

### constructor(*address* `_mmLib`, *address* `_token1`, *address* `_token2`)

- **State mutability**: `nonpayable`
- **Signature hash**: `6dd23b5b`

The Market Maker constructor

#### Inputs

| type      | name      | description                                                 |
| --------- | --------- | ----------------------------------------------------------- |
| *address* | `_mmLib`  | address address of the market making lib contract           |
| *address* | `_token1` | address contract of the first token for marker making (CLN) |
| *address* | `_token2` | address contract of the second token for marker making (CC) |

#### Outputs

| type   |
| ------ |
| *bool* |

### isOpenForPublic()

- **State mutability**: `nonpayable`
- **Signature hash**: `727d508a`

returns true iff the contract is open for public trade.

#### Outputs

| type   |
| ------ |
| *bool* |

### acceptOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `79ba5097`

Accept ownership transfer. This method needs to be called by the perviously proposed owner.

### withdrawExcessReserves()

- **State mutability**: `nonpayable`
- **Signature hash**: `7dfce5e9`

allow admin to withraw excess tokens accumulated due to precision

#### Outputs

| type      | name           |
| --------- | -------------- |
| *uint256* | `returnAmount` |

### initializeAfterTransfer()

- **State mutability**: `nonpayable`
- **Signature hash**: `8bc0b887`

initialize the contract after transfering all of the tokens form the pair

#### Outputs

| type   |
| ------ |
| *bool* |

### change(*address* `_fromToken`, *uint256* `_inAmount`, *address* `_toToken`, *uint256* `_minReturn`)

- **State mutability**: `nonpayable`
- **Signature hash**: `95068886`

change tokens.

#### Inputs

| type      | name         | description              |
| --------- | ------------ | ------------------------ |
| *address* | `_fromToken` | the token to sell from   |
| *uint256* | `_inAmount`  | the amount to sell       |
| *address* | `_toToken`   | the token to buy         |
| *uint256* | `_minReturn` | the munimum token to buy |

#### Outputs

| type      | name           | description                           |
| --------- | -------------- | ------------------------------------- |
| *uint256* | `returnAmount` | the return amount of the buying token |

### quote(*address* `_fromToken`, *uint256* `_inAmount`, *address* `_toToken`)

- **State mutability**: `view`
- **Signature hash**: `ad18ad0c`

get a quote for exchanging.

#### Inputs

| type      | name         | description            |
| --------- | ------------ | ---------------------- |
| *address* | `_fromToken` | the token to sell from |
| *uint256* | `_inAmount`  | the amount to sell     |
| *address* | `_toToken`   | the token to buy       |

#### Outputs

| type      | name           | description                           |
| --------- | -------------- | ------------------------------------- |
| *uint256* | `returnAmount` | the return amount of the buying token |

### tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)

- **State mutability**: `nonpayable`
- **Signature hash**: `c0ee0b8a`

Called when the receiver of transfer is contract

#### Inputs

| type      | name      | description                                             |
| --------- | --------- | ------------------------------------------------------- |
| *address* | `_sender` | address the address of tokens sender                    |
| *uint256* | `_value`  | uint256 the amount of tokens to be transferred.         |
| *bytes*   | `_data`   | bytes data that can be attached to the token transation |

#### Outputs

| type   | name |
| ------ | ---- |
| *bool* | `ok` |

### getPrice(*uint256* `_R1`, *uint256* `_R2`, *uint256* `_S1`, *uint256* `_S2`)

- **State mutability**: `view`
- **Signature hash**: `c4725577`

the price of token1 in terms of token2, represented in 18 decimals. price = (S1 - R1) / (S2 - R2) * (S2 / S1)^2

#### Inputs

| type      | name  | description                              |
| --------- | ----- | ---------------------------------------- |
| *uint256* | `_R1` | uint256 reserve of the first token       |
| *uint256* | `_R2` | uint256 reserve of the second token      |
| *uint256* | `_S1` | uint256 total supply of the first token  |
| *uint256* | `_S2` | uint256 total supply of the second token |

#### Outputs

| type      | name    |
| --------- | ------- |
| *uint256* | `price` |

### change(*address* `_fromToken`, *uint256* `_inAmount`, *address* `_toToken`)

- **State mutability**: `nonpayable`
- **Signature hash**: `de683a7d`

change tokens.

#### Inputs

| type      | name         | description            |
| --------- | ------------ | ---------------------- |
| *address* | `_fromToken` | the token to sell from |
| *uint256* | `_inAmount`  | the amount to sell     |
| *address* | `_toToken`   | the token to buy       |

#### Outputs

| type      | name           | description                           |
| --------- | -------------- | ------------------------------------- |
| *uint256* | `returnAmount` | the return amount of the buying token |

### change(*address* `_toToken`, *uint256* `_minReturn`)

- **State mutability**: `nonpayable`
- **Signature hash**: `e51f2c68`

change tokens using erc223\erc677 transfer.

#### Inputs

| type      | name         | description              |
| --------- | ------------ | ------------------------ |
| *address* | `_toToken`   | the token to buy         |
| *uint256* | `_minReturn` | the munimum token to buy |

#### Outputs

| type      | name           | description                           |
| --------- | -------------- | ------------------------------------- |
| *uint256* | `returnAmount` | the return amount of the buying token |

### openForPublicTrade()

- **State mutability**: `nonpayable`
- **Signature hash**: `ec332488`

open the Market Maker for public trade.

#### Outputs

| type   |
| ------ |
| *bool* |
