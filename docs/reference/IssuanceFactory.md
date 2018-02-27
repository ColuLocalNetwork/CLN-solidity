* [IssuanceFactory](#issuancefactory)
  * [Accessors](#issuancefactory-accessors)
  * [Events](#issuancefactory-events)
    * [CLNRaised(*address* indexed `token`, *address* indexed `participant`, *uint256* `amount`)](#clnraisedaddress-indexed-token-address-indexed-participant-uint256-amount)
    * [CLNRefunded(*address* indexed `token`, *address* indexed `participant`, *uint256* `amount`)](#clnrefundedaddress-indexed-token-address-indexed-participant-uint256-amount)
    * [SaleFinalized(*address* indexed `token`, *uint256* `clnRaised`)](#salefinalizedaddress-indexed-token-uint256-clnraised)
    * [MarketOpen(*address* indexed `marketMaker`)](#marketopenaddress-indexed-marketmaker)
    * [TokenCreated(*address* indexed `token`, *address* indexed `owner`)](#tokencreatedaddress-indexed-token-address-indexed-owner)
    * [OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)](#ownershiprequestedaddress-indexed-_by-address-indexed-_to)
    * [OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)](#ownershiptransferredaddress-indexed-_from-address-indexed-_to)
  * [Functions](#issuancefactory-functions)
    * [supportsToken(*address* `_token`)](#supportstokenaddress-_token)
    * [requestOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestownershiptransferaddress-_newownercandidate)
    * [getIssuanceCount(*bool* `_pending`, *bool* `_started`, *bool* `_successful`, *bool* `_failed`)](#getissuancecountbool-_pending-bool-_started-bool-_successful-bool-_failed)
    * [currencyMap(*address*)](#currencymapaddress)
    * [openMarket(*address*)](#openmarketaddress)
    * [isValidIssuance(*uint256* `_hardcap`, *uint256* `_price`, *uint256* `_S2`, *uint256* `_R2`)](#isvalidissuanceuint256-_hardcap-uint256-_price-uint256-_s2-uint256-_r2)
    * [refund(*address* `_token`, *uint256* `_ccAmount`)](#refundaddress-_token-uint256-_ccamount)
    * [createIssuance(*uint256* `_startTime`, *uint256* `_durationTime`, *uint256* `_hardcap`, *uint256* `_reserveAmount`, *string* `_name`, *string* `_symbol`, *uint8* `_decimals`, *uint256* `_totalSupply`)](#createissuanceuint256-_starttime-uint256-_durationtime-uint256-_hardcap-uint256-_reserveamount-string-_name-string-_symbol-uint8-_decimals-uint256-_totalsupply)
    * [extractCLNfromMarketMaker()](#extractclnfrommarketmaker)
    * [finalize(*address* `_token`)](#finalizeaddress-_token)
    * [refund()](#refund)
    * [acceptOwnership()](#acceptownership)
    * [getMarketMakerAddressFromToken(*address* `_token`)](#getmarketmakeraddressfromtokenaddress-_token)
    * [issueMap(*address*)](#issuemapaddress)
    * [participate(*address* `_token`, *uint256* `_clnAmount`)](#participateaddress-_token-uint256-_clnamount)
    * [insertCLNtoMarketMaker(*address*)](#insertclntomarketmakeraddress)
    * [participate(*address* `_token`)](#participateaddress-_token)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)
    * [getIssuanceIds(*bool* `_pending`, *bool* `_started`, *bool* `_successful`, *bool* `_failed`, *uint256* `_offset`, *uint256* `_limit`)](#getissuanceidsbool-_pending-bool-_started-bool-_successful-bool-_failed-uint256-_offset-uint256-_limit)
    * [createCurrency(*string* `_name`, *string* `_symbol`, *uint8* `_decimals`, *uint256* `_totalSupply`)](#createcurrencystring-_name-string-_symbol-uint8-_decimals-uint256-_totalsupply)
    * [extractCLNfromMarketMaker(*address*, *uint256*)](#extractclnfrommarketmakeraddress-uint256)
    * [transferAnyERC20Token(*address* `_tokenAddress`, *uint256* `_amount`)](#transferanyerc20tokenaddress-_tokenaddress-uint256-_amount)
    * [insertCLNtoMarketMaker(*address*, *uint256*)](#insertclntomarketmakeraddress-uint256)

# IssuanceFactory

### Colu Issuance factoy with CLN for CC tokens.

- **Author**: Rotem Lev.
- **Constructor**: IssuanceFactory(*address* `_mmLib`, *address* `_clnAddress`)
- This contract does **not** have a fallback function.

## IssuanceFactory Accessors

* *address* clnAddress() `451cd22d`
* *uint256* totalCLNcustodian() `4c4efef7`
* *address* mmLibAddress() `4d689543`
* *address* tokens(*uint256*) `4f64b2be`
* *address* owner() `8da5cb5b`
* *uint256* PRECISION() `aaf5eb68`
* *uint256* CLNTotalSupply() `c73fcee2`
* *address* newOwnerCandidate() `d091b550`

## IssuanceFactory Events

### CLNRaised(*address* indexed `token`, *address* indexed `participant`, *uint256* `amount`)

**Signature hash**: `79d42bfe5aee33480d228f549d27dfe0b16afa315211d6f185eba320d9f73215`

### CLNRefunded(*address* indexed `token`, *address* indexed `participant`, *uint256* `amount`)

**Signature hash**: `923f098eec6248756bf95aba85b05e07a7a305f71374683c020175ccc0ea5aa3`

### SaleFinalized(*address* indexed `token`, *uint256* `clnRaised`)

**Signature hash**: `2311e345392856136e60cea923b9a2df26c14e8ae13274f4271942890a892ca4`

### MarketOpen(*address* indexed `marketMaker`)

**Signature hash**: `d89dc0ad0949ca0a2fb2c8b9bd54f53eef80290fdbb947a3e778efe61e6fef92`

### TokenCreated(*address* indexed `token`, *address* indexed `owner`)

**Signature hash**: `d5f9bdf12adf29dab0248c349842c3822d53ae2bb4f36352f301630d018c8139`

### OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)

**Signature hash**: `13a4b3bc0d5234dd3d87c9f1557d8faefa37986da62c36ba49309e2fb2c9aec4`

### OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)

**Signature hash**: `8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0`

## IssuanceFactory Functions

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

### getIssuanceCount(*bool* `_pending`, *bool* `_started`, *bool* `_successful`, *bool* `_failed`)

- **State mutability**: `view`
- **Signature hash**: `0fab7539`

Returns total number of issuances after filters are applied.this function is gas wasteful so do not call this from a state changing transaction

#### Inputs

| type   | name          | description                                      |
| ------ | ------------- | ------------------------------------------------ |
| *bool* | `_pending`    | include pending currency issuances.              |
| *bool* | `_started`    | include started currency issuances.              |
| *bool* | `_successful` | include successful and ended currency issuances. |
| *bool* | `_failed`     | include failed and ended currency issuances.     |

#### Outputs

| type      | name     | description                                                   |
| --------- | -------- | ------------------------------------------------------------- |
| *uint256* | `_count` | Total number of currency issuances after filters are applied. |

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

### openMarket(*address*)

- **State mutability**: `nonpayable`
- **Signature hash**: `21a4c6c3`

opens the Market Maker to recvice transactions from all sources.Request to transfer ownership of Market Maker contract to Owner instead of factory.

#### Inputs

| type      |
| --------- |
| *address* |

#### Outputs

| type   |
| ------ |
| *bool* |

### isValidIssuance(*uint256* `_hardcap`, *uint256* `_price`, *uint256* `_S2`, *uint256* `_R2`)

- **State mutability**: `view`
- **Signature hash**: `236a160e`

checks if the parameters that were sent to the create are valid for a promised price and buyback

#### Inputs

| type      | name       | description                                                               |
| --------- | ---------- | ------------------------------------------------------------------------- |
| *uint256* | `_hardcap` | uint256 CLN hardcap for issuance                                          |
| *uint256* | `_price`   | uint256 computed through the market maker using the supplies and reserves |
| *uint256* | `_S2`      | uint256 supply of the CC token                                            |
| *uint256* | `_R2`      | uint256 reserve of the CC token                                           |

#### Outputs

| type   |
| ------ |
| *bool* |

### refund(*address* `_token`, *uint256* `_ccAmount`)

- **State mutability**: `nonpayable`
- **Signature hash**: `410085df`

Give back CC and get a refund back in CLN, dev can only be called after sale ended and the softcap not reached

#### Inputs

| type      | name        | description                                                 |
| --------- | ----------- | ----------------------------------------------------------- |
| *address* | `_token`    | address token address for this issuance (same as CC adress) |
| *uint256* | `_ccAmount` | uint256 amount of CC to try and refund                      |

#### Outputs

| type   |
| ------ |
| *bool* |

### createIssuance(*uint256* `_startTime`, *uint256* `_durationTime`, *uint256* `_hardcap`, *uint256* `_reserveAmount`, *string* `_name`, *string* `_symbol`, *uint8* `_decimals`, *uint256* `_totalSupply`)

- **State mutability**: `nonpayable`
- **Signature hash**: `436577ae`

createIssuance create local currency issuance sale

#### Inputs

| type      | name             | description                             |
| --------- | ---------------- | --------------------------------------- |
| *uint256* | `_startTime`     | uint256 blocktime for sale start        |
| *uint256* | `_durationTime`  | uint 256 duration of the sale           |
| *uint256* | `_hardcap`       | uint CLN hardcap for issuance           |
| *uint256* | `_reserveAmount` | uint CLN reserve amount                 |
| *string*  | `_name`          | string name of the token                |
| *string*  | `_symbol`        | string symbol of the token              |
| *uint8*   | `_decimals`      | uint8 ERC20 decimals of local currency  |
| *uint256* | `_totalSupply`   | uint total supply of the local currency |

#### Outputs

| type      |
| --------- |
| *address* |

### extractCLNfromMarketMaker()

- **State mutability**: `nonpayable`
- **Signature hash**: `4daadff9`

ERC223 transferAndCall, send CC to the market maker contract can only be called by owner (see MarketMaker)sending CC will return CLN from the reserve to the sender.

#### Outputs

| type      |
| --------- |
| *uint256* |

### finalize(*address* `_token`)

- **State mutability**: `nonpayable`
- **Signature hash**: `4ef39b75`

called by the creator to finish the sale, open the market maker and get his tokenscan only be called after the sale end time and if the sale passed the softcap

#### Inputs

| type      | name     | description                                                 |
| --------- | -------- | ----------------------------------------------------------- |
| *address* | `_token` | address token address for this issuance (same as CC adress) |

#### Outputs

| type   |
| ------ |
| *bool* |

### refund()

- **State mutability**: `nonpayable`
- **Signature hash**: `590e1ae3`

Give back CC and get a refund back in CLN, dev can only be called after sale ended and the softcap not

#### Outputs

| type   |
| ------ |
| *bool* |

### acceptOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `79ba5097`

Accept ownership transfer. This method needs to be called by the perviously proposed owner.

### getMarketMakerAddressFromToken(*address* `_token`)

- **State mutability**: `view`
- **Signature hash**: `ac3c49e0`

helper function to fetch market maker contract address deploed with the CC

#### Inputs

| type      | name     | description                                                 |
| --------- | -------- | ----------------------------------------------------------- |
| *address* | `_token` | address token address for this issuance (same as CC adress) |

#### Outputs

| type      |
| --------- |
| *address* |

### issueMap(*address*)

- **State mutability**: `view`
- **Signature hash**: `ae95c24e`

#### Inputs

| type      |
| --------- |
| *address* |

#### Outputs

| type      | name          |
| --------- | ------------- |
| *uint256* | `hardcap`     |
| *uint256* | `reserve`     |
| *uint256* | `startTime`   |
| *uint256* | `endTime`     |
| *uint256* | `targetPrice` |
| *uint256* | `clnRaised`   |

### participate(*address* `_token`, *uint256* `_clnAmount`)

- **State mutability**: `nonpayable`
- **Signature hash**: `b64afbe5`

participate in the issuance of the local currency

#### Inputs

| type      | name         | description                                                 |
| --------- | ------------ | ----------------------------------------------------------- |
| *address* | `_token`     | address token address for this issuance (same as CC adress) |
| *uint256* | `_clnAmount` | uint256 amount of CLN to try and participate                |

#### Outputs

| type      | name            | description                                                              |
| --------- | --------------- | ------------------------------------------------------------------------ |
| *uint256* | `releaseAmount` | releaseAmount uint amount of CC tokens released and transfered to sender |

### insertCLNtoMarketMaker(*address*)

- **State mutability**: `nonpayable`
- **Signature hash**: `b7073d2e`

ERC223 transferAndCall, send cln to the market maker contract can only be called by owner (see MarketMaker)sending CLN will return CC from the reserve to the sender.

#### Inputs

| type      |
| --------- |
| *address* |

#### Outputs

| type      |
| --------- |
| *uint256* |

### participate(*address* `_token`)

- **State mutability**: `nonpayable`
- **Signature hash**: `b91038c7`

Participate in the CLN based issuance (for contract)

#### Inputs

| type      | name     | description                                                 |
| --------- | -------- | ----------------------------------------------------------- |
| *address* | `_token` | address token address for this issuance (same as CC adress) |

#### Outputs

| type      | name            |
| --------- | --------------- |
| *uint256* | `releaseAmount` |

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

### getIssuanceIds(*bool* `_pending`, *bool* `_started`, *bool* `_successful`, *bool* `_failed`, *uint256* `_offset`, *uint256* `_limit`)

- **State mutability**: `view`
- **Signature hash**: `cfa059ee`

Returns list of issuance ids (allso the token address of the issuance) in defined range after filters are applied._offset and _limit parameters are intended for paginationthis function is gas wasteful so do not call this from a state changing transaction

#### Inputs

| type      | name          | description                                      |
| --------- | ------------- | ------------------------------------------------ |
| *bool*    | `_pending`    | include pending currency issuances.              |
| *bool*    | `_started`    | include started currency issuances.              |
| *bool*    | `_successful` | include successful and ended currency issuances. |
| *bool*    | `_failed`     | include failed and ended currency issuances.     |
| *uint256* | `_offset`     | index start position of issuance ids array.      |
| *uint256* | `_limit`      | maximum number of issuance ids to return.        |

#### Outputs

| type        | name           | description                                   |
| ----------- | -------------- | --------------------------------------------- |
| *address[]* | `_issuanceIds` | Returns array of token adresses for issuance. |

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

### extractCLNfromMarketMaker(*address*, *uint256*)

- **State mutability**: `nonpayable`
- **Signature hash**: `d9eb547b`

normal send CC to the market maker contract, sender must approve() before calling method. can only be called by ownersending CC will return CLN from the reserve to the sender.

#### Inputs

| type      |
| --------- |
| *address* |
| *uint256* |

#### Outputs

| type      |
| --------- |
| *uint256* |

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

### insertCLNtoMarketMaker(*address*, *uint256*)

- **State mutability**: `nonpayable`
- **Signature hash**: `e5714ea3`

normal send cln to the market maker contract, sender must approve() before calling method. can only be called by ownersending CLN will return CC from the reserve to the sender.

#### Inputs

| type      |
| --------- |
| *address* |
| *uint256* |

#### Outputs

| type      |
| --------- |
| *uint256* |
