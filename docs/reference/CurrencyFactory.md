* [CurrencyFactory](#currencyfactory)
  * [Accessors](#currencyfactory-accessors)
  * [Events](#currencyfactory-events)
    * [MarketOpen(*address* indexed `marketMaker`)](#marketopenaddress-indexed-marketmaker)
    * [TokenCreated(*address* indexed `token`, *address* indexed `owner`)](#tokencreatedaddress-indexed-token-address-indexed-owner)
    * [OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)](#ownershiprequestedaddress-indexed-_by-address-indexed-_to)
    * [OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)](#ownershiptransferredaddress-indexed-_from-address-indexed-_to)
  * [Functions](#currencyfactory-functions)
    * [supportsToken(*address* `_token`)](#supportstokenaddress-_token)
    * [requestOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestownershiptransferaddress-_newownercandidate)
    * [currencyMap(*address*)](#currencymapaddress)
    * [openMarket(*address* `_token`)](#openmarketaddress-_token)
    * [extractCLNfromMarketMaker()](#extractclnfrommarketmaker)
    * [acceptOwnership()](#acceptownership)
    * [getMarketMakerAddressFromToken(*address* `_token`)](#getmarketmakeraddressfromtokenaddress-_token)
    * [insertCLNtoMarketMaker(*address* `_token`)](#insertclntomarketmakeraddress-_token)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)
    * [createCurrency(*string* `_name`, *string* `_symbol`, *uint8* `_decimals`, *uint256* `_totalSupply`)](#createcurrencystring-_name-string-_symbol-uint8-_decimals-uint256-_totalsupply)
    * [extractCLNfromMarketMaker(*address* `_token`, *uint256* `_ccAmount`)](#extractclnfrommarketmakeraddress-_token-uint256-_ccamount)
    * [transferAnyERC20Token(*address* `_tokenAddress`, *uint256* `_amount`)](#transferanyerc20tokenaddress-_tokenaddress-uint256-_amount)
    * [insertCLNtoMarketMaker(*address* `_token`, *uint256* `_clnAmount`)](#insertclntomarketmakeraddress-_token-uint256-_clnamount)

# CurrencyFactory

### Colu Local Currency + Market Maker factory contract.

- **Author**: Rotem Lev.
- **Constructor**: CurrencyFactory(*address* `_mmLib`, *address* `_clnAddress`)
- This contract does **not** have a fallback function.

## CurrencyFactory Accessors

* *address* clnAddress() `451cd22d`
* *address* mmLibAddress() `4d689543`
* *address* tokens(*uint256*) `4f64b2be`
* *address* owner() `8da5cb5b`
* *address* newOwnerCandidate() `d091b550`

## CurrencyFactory Events

### MarketOpen(*address* indexed `marketMaker`)

**Signature hash**: `d89dc0ad0949ca0a2fb2c8b9bd54f53eef80290fdbb947a3e778efe61e6fef92`

### TokenCreated(*address* indexed `token`, *address* indexed `owner`)

**Signature hash**: `d5f9bdf12adf29dab0248c349842c3822d53ae2bb4f36352f301630d018c8139`

### OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)

**Signature hash**: `13a4b3bc0d5234dd3d87c9f1557d8faefa37986da62c36ba49309e2fb2c9aec4`

### OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)

**Signature hash**: `8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0`

## CurrencyFactory Functions

### supportsToken(*address* `_token`)

- **State mutability**: `view`
- **Signature hash**: `061f7650`

implementation for standard 223 reciver.

#### Inputs

| type      | name     | description                                     |
| --------- | -------- | ----------------------------------------------- |
| *address* | `_token` | address of the token used with transferAndCall. |

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

### currencyMap(*address*)

- **State mutability**: `view`
- **Signature hash**: `115bdfe7`

#### Inputs

| type      |
| --------- |
| *address* |

#### Outputs

| type      | name          |
| --------- | ------------- |
| *string*  | `name`        |
| *uint8*   | `decimals`    |
| *uint256* | `totalSupply` |
| *address* | `owner`       |
| *address* | `mmAddress`   |

### openMarket(*address* `_token`)

- **State mutability**: `nonpayable`
- **Signature hash**: `21a4c6c3`

opens the Market Maker to recvice transactions from all sources.Request to transfer ownership of Market Maker contract to Owner instead of factory.

#### Inputs

| type      | name     | description                                              |
| --------- | -------- | -------------------------------------------------------- |
| *address* | `_token` | address address of the cc token managed by this factory. |

#### Outputs

| type   |
| ------ |
| *bool* |

### extractCLNfromMarketMaker()

- **State mutability**: `nonpayable`
- **Signature hash**: `4daadff9`

ERC223 transferAndCall, send CC to the market maker contract can only be called by owner (see MarketMaker)sending CC will return CLN from the reserve to the sender.

#### Outputs

| type      | name              |
| --------- | ----------------- |
| *uint256* | `_clnTokenAmount` |

### acceptOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `79ba5097`

Accept ownership transfer. This method needs to be called by the perviously proposed owner.

### getMarketMakerAddressFromToken(*address* `_token`)

- **State mutability**: `view`
- **Signature hash**: `ac3c49e0`

helper function to get the market maker address form token

#### Inputs

| type      | name     | description                                     |
| --------- | -------- | ----------------------------------------------- |
| *address* | `_token` | address of the token used with transferAndCall. |

#### Outputs

| type      | name                  |
| --------- | --------------------- |
| *address* | `_marketMakerAddress` |

### insertCLNtoMarketMaker(*address* `_token`)

- **State mutability**: `nonpayable`
- **Signature hash**: `b7073d2e`

ERC223 transferAndCall, send cln to the market maker contract can only be called by owner (see MarketMaker)sending CLN will return CC from the reserve to the sender.

#### Inputs

| type      | name     | description                                              |
| --------- | -------- | -------------------------------------------------------- |
| *address* | `_token` | address address of the cc token managed by this factory. |

#### Outputs

| type      | name              |
| --------- | ----------------- |
| *uint256* | `_subTokenAmount` |

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

### createCurrency(*string* `_name`, *string* `_symbol`, *uint8* `_decimals`, *uint256* `_totalSupply`)

- **State mutability**: `nonpayable`
- **Signature hash**: `d8bd4761`

create the MarketMaker and the CC token put all the CC token in the Market Maker reserve

#### Inputs

| type      | name           | description                                           |
| --------- | -------------- | ----------------------------------------------------- |
| *string*  | `_name`        | string name for CC token that is created.             |
| *string*  | `_symbol`      | string symbol for CC token that is created.           |
| *uint8*   | `_decimals`    | uint8 percison for CC token that is created.          |
| *uint256* | `_totalSupply` | uint256 total supply of the CC token that is created. |

#### Outputs

| type      |
| --------- |
| *address* |

### extractCLNfromMarketMaker(*address* `_token`, *uint256* `_ccAmount`)

- **State mutability**: `nonpayable`
- **Signature hash**: `d9eb547b`

normal send cc to the market maker contract, sender must approve() before calling method. can only be called by ownersending CC will return CLN from the reserve to the sender.

#### Inputs

| type      | name        | description                                                     |
| --------- | ----------- | --------------------------------------------------------------- |
| *address* | `_token`    | address address of the cc token managed by this factory.        |
| *uint256* | `_ccAmount` | uint256 amount of CC to transfer into the Market Maker reserve. |

#### Outputs

| type      | name              |
| --------- | ----------------- |
| *uint256* | `_clnTokenAmount` |

### transferAnyERC20Token(*address* `_tokenAddress`, *uint256* `_amount`)

- **State mutability**: `nonpayable`
- **Signature hash**: `dc39d06d`

Allow the owner to transfer out any accidentally sent ERC20 tokens.

#### Inputs

| type      | name            | description                                     |
| --------- | --------------- | ----------------------------------------------- |
| *address* | `_tokenAddress` | address The address of the ERC20 contract.      |
| *uint256* | `_amount`       | uint256 The amount of tokens to be transferred. |

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |

### insertCLNtoMarketMaker(*address* `_token`, *uint256* `_clnAmount`)

- **State mutability**: `nonpayable`
- **Signature hash**: `e5714ea3`

normal send cln to the market maker contract, sender must approve() before calling method. can only be called by ownersending CLN will return CC from the reserve to the sender.

#### Inputs

| type      | name         | description                                                      |
| --------- | ------------ | ---------------------------------------------------------------- |
| *address* | `_token`     | address address of the cc token managed by this factory.         |
| *uint256* | `_clnAmount` | uint256 amount of CLN to transfer into the Market Maker reserve. |

#### Outputs

| type      | name              |
| --------- | ----------------- |
| *uint256* | `_subTokenAmount` |
