* [MarketMaker](#marketmaker)
  * [Events](#marketmaker-events)
    * [Change(*address* indexed `fromToken`, *uint256* `inAmount`, *address* indexed `toToken`, *uint256* `returnAmount`, *address* indexed `account`)](#changeaddress-indexed-fromtoken-uint256-inamount-address-indexed-totoken-uint256-returnamount-address-indexed-account)
  * [Functions](#marketmaker-functions)
    * [change(*address* `_toToken`)](#changeaddress-_totoken)
    * [isOpenForPublic()](#isopenforpublic)
    * [change(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`, *uint256* `_minReturn`)](#changeaddress-_fromtoken-uint256-_amount-address-_totoken-uint256-_minreturn)
    * [quote(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`)](#quoteaddress-_fromtoken-uint256-_amount-address-_totoken)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)
    * [change(*address* `_fromToken`, *uint256* `_amount`, *address* `_toToken`)](#changeaddress-_fromtoken-uint256-_amount-address-_totoken)
    * [change(*address* `_toToken`, *uint256* `_minReturn`)](#changeaddress-_totoken-uint256-_minreturn)
    * [getCurrentPrice()](#getcurrentprice)
    * [openForPublicTrade()](#openforpublictrade)

# MarketMaker

### Market Maker Interface.

- **Author**: Tal Beja.
- **Constructor**: MarketMaker()
- This contract does **not** have a fallback function.

## MarketMaker Events

### Change(*address* indexed `fromToken`, *uint256* `inAmount`, *address* indexed `toToken`, *uint256* `returnAmount`, *address* indexed `account`)

**Signature hash**: `4a5c2d6efb7e2af02ed2dc99fe76b65b177b6e95d687b97317c3910f824f85cc`

## MarketMaker Functions

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

### isOpenForPublic()

- **State mutability**: `nonpayable`
- **Signature hash**: `727d508a`

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |

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
