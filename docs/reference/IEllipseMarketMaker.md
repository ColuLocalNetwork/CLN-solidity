* [IEllipseMarketMaker](#iellipsemarketmaker)
  * [Accessors](#iellipsemarketmaker-accessors)
  * [Events](#iellipsemarketmaker-events)
    * [Change(*address* indexed `fromToken`, *uint256* `inAmount`, *address* indexed `toToken`, *uint256* `returnAmount`, *address* indexed `account`)](#changeaddress-indexed-fromtoken-uint256-inamount-address-indexed-totoken-uint256-returnamount-address-indexed-account)
  * [Functions](#iellipsemarketmaker-functions)
    * [supportsToken(*address* `token`)](#supportstokenaddress-token)
    * [change(*address* `_toToken`)](#changeaddress-_totoken)
    * [initializeOnTransfer()](#initializeontransfer)
    * [calcReserve(*uint256* `_R1`, *uint256* `_S1`, *uint256* `_S2`)](#calcreserveuint256-_r1-uint256-_s1-uint256-_s2)
    * [isOpenForPublic()](#isopenforpublic)
    * [withdrawExcessReserves()](#withdrawexcessreserves)
    * [initializeAfterTransfer()](#initializeaftertransfer)
    * [change(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`, *uint256* `_minReturn`)](#changeaddress-_fromtoken-uint256-_amount-address-_totoken-uint256-_minreturn)
    * [quote(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`)](#quoteaddress-_fromtoken-uint256-_amount-address-_totoken)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)
    * [getPrice(*uint256* `_R1`, *uint256* `_R2`, *uint256* `_S1`, *uint256* `_S2`)](#getpriceuint256-_r1-uint256-_r2-uint256-_s1-uint256-_s2)
    * [change(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`)](#changeaddress-_fromtoken-uint256-_amount-address-_totoken)
    * [change(*address* `_toToken`, *uint256* `_minReturn`)](#changeaddress-_totoken-uint256-_minreturn)
    * [getCurrentPrice()](#getcurrentprice)
    * [openForPublicTrade()](#openforpublictrade)

# IEllipseMarketMaker

### Ellipse Market Maker Interfase

- **Author**: Tal Beja
- **Constructor**: IEllipseMarketMaker()
- This contract does **not** have a fallback function.

## IEllipseMarketMaker Accessors

* *bool* operational() `0a401086`
* *address* token2() `25be124e`
* *address* mmLib() `63ddc54d`
* *uint256* S2() `65581793`
* *bool* validateReserves() `6e76a89f`
* *uint256* S1() `7826f28f`
* *uint256* PRECISION() `aaf5eb68`
* *uint256* R1() `b22dd2ca`
* *address* token1() `d21220a7`
* *bool* openForPublic() `eff3c4e7`
* *uint256* R2() `fee2cb05`

## IEllipseMarketMaker Events

### Change(*address* indexed `fromToken`, *uint256* `inAmount`, *address* indexed `toToken`, *uint256* `returnAmount`, *address* indexed `account`)

**Signature hash**: `4a5c2d6efb7e2af02ed2dc99fe76b65b177b6e95d687b97317c3910f824f85cc`

## IEllipseMarketMaker Functions

### supportsToken(*address* `token`)

- **State mutability**: `view`
- **Signature hash**: `061f7650`

#### Inputs

| type      | name    |
| --------- | ------- |
| *address* | `token` |

#### Outputs

| type   |
| ------ |
| *bool* |

### change(*address* `_toToken`)

- **State mutability**: `nonpayable`
- **Signature hash**: `1e77933e`

#### Inputs

| type      | name       |
| --------- | ---------- |
| *address* | `_toToken` |

#### Outputs

| type      | name            |
| --------- | --------------- |
| *uint256* | `_returnAmount` |

### initializeOnTransfer()

- **State mutability**: `nonpayable`
- **Signature hash**: `3c3c88b1`

#### Outputs

| type   |
| ------ |
| *bool* |

### calcReserve(*uint256* `_R1`, *uint256* `_S1`, *uint256* `_S2`)

- **State mutability**: `pure`
- **Signature hash**: `6bfae928`

#### Inputs

| type      | name  |
| --------- | ----- |
| *uint256* | `_R1` |
| *uint256* | `_S1` |
| *uint256* | `_S2` |

#### Outputs

| type      |
| --------- |
| *uint256* |

### isOpenForPublic()

- **State mutability**: `nonpayable`
- **Signature hash**: `727d508a`

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |

### withdrawExcessReserves()

- **State mutability**: `nonpayable`
- **Signature hash**: `7dfce5e9`

#### Outputs

| type      |
| --------- |
| *uint256* |

### initializeAfterTransfer()

- **State mutability**: `nonpayable`
- **Signature hash**: `8bc0b887`

#### Outputs

| type   |
| ------ |
| *bool* |

### change(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`, *uint256* `_minReturn`)

- **State mutability**: `nonpayable`
- **Signature hash**: `95068886`

#### Inputs

| type      | name         |
| --------- | ------------ |
| *address* | `_fromToken` |
| *uint256* | `_amount`    |
| *address* | `_toToken`   |
| *uint256* | `_minReturn` |

#### Outputs

| type      | name            |
| --------- | --------------- |
| *uint256* | `_returnAmount` |

### quote(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`)

- **State mutability**: `view`
- **Signature hash**: `ad18ad0c`

#### Inputs

| type      | name         |
| --------- | ------------ |
| *address* | `_fromToken` |
| *uint256* | `_amount`    |
| *address* | `_toToken`   |

#### Outputs

| type      | name            |
| --------- | --------------- |
| *uint256* | `_returnAmount` |

### tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)

- **State mutability**: `nonpayable`
- **Signature hash**: `c0ee0b8a`

#### Inputs

| type      | name      |
| --------- | --------- |
| *address* | `_sender` |
| *uint256* | `_value`  |
| *bytes*   | `_data`   |

#### Outputs

| type   | name |
| ------ | ---- |
| *bool* | `ok` |

### getPrice(*uint256* `_R1`, *uint256* `_R2`, *uint256* `_S1`, *uint256* `_S2`)

- **State mutability**: `view`
- **Signature hash**: `c4725577`

#### Inputs

| type      | name  |
| --------- | ----- |
| *uint256* | `_R1` |
| *uint256* | `_R2` |
| *uint256* | `_S1` |
| *uint256* | `_S2` |

#### Outputs

| type      |
| --------- |
| *uint256* |

### change(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`)

- **State mutability**: `nonpayable`
- **Signature hash**: `de683a7d`

#### Inputs

| type      | name         |
| --------- | ------------ |
| *address* | `_fromToken` |
| *uint256* | `_amount`    |
| *address* | `_toToken`   |

#### Outputs

| type      | name            |
| --------- | --------------- |
| *uint256* | `_returnAmount` |

### change(*address* `_toToken`, *uint256* `_minReturn`)

- **State mutability**: `nonpayable`
- **Signature hash**: `e51f2c68`

#### Inputs

| type      | name         |
| --------- | ------------ |
| *address* | `_toToken`   |
| *uint256* | `_minReturn` |

#### Outputs

| type      | name            |
| --------- | --------------- |
| *uint256* | `_returnAmount` |

### getCurrentPrice()

- **State mutability**: `view`
- **Signature hash**: `eb91d37e`

#### Outputs

| type      | name     |
| --------- | -------- |
| *uint256* | `_price` |

### openForPublicTrade()

- **State mutability**: `nonpayable`
- **Signature hash**: `ec332488`

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |
