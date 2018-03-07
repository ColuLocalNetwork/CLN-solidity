* [ColuLocalNetwork](#colulocalnetwork)
  * [Accessors](#colulocalnetwork-accessors)
  * [Events](#colulocalnetwork-events)
    * [TokensTransferable()](#tokenstransferable)
    * [OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)](#ownershiprequestedaddress-indexed-_by-address-indexed-_to)
    * [OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)](#ownershiptransferredaddress-indexed-_from-address-indexed-_to)
    * [Approval(*address* indexed `owner`, *address* indexed `spender`, *uint256* `value`)](#approvaladdress-indexed-owner-address-indexed-spender-uint256-value)
    * [Transfer(*address* indexed `from`, *address* indexed `to`, *uint256* `value`)](#transferaddress-indexed-from-address-indexed-to-uint256-value)
    * [TransferAndCall(*address* indexed `from`, *address* indexed `to`, *uint256* `value`, *bytes* `data`)](#transferandcalladdress-indexed-from-address-indexed-to-uint256-value-bytes-data)
  * [Functions](#colulocalnetwork-functions)
    * [requestOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestownershiptransferaddress-_newownercandidate)
    * [approve(*address* `_spender`, *uint256* `_value`)](#approveaddress-_spender-uint256-_value)
    * [transferFrom(*address* `_from`, *address* `_to`, *uint256* `_value`)](#transferfromaddress-_from-address-_to-uint256-_value)
    * [transferAndCall(*address* `_to`, *uint256* `_value`, *bytes* `_data`)](#transferandcalladdress-_to-uint256-_value-bytes-_data)
    * [makeTokensTransferable()](#maketokenstransferable)
    * [balanceOf(*address* `_owner`)](#balanceofaddress-_owner)
    * [acceptOwnership()](#acceptownership)
    * [transfer(*address* `_to`, *uint256* `_value`)](#transferaddress-_to-uint256-_value)
    * [transferAnyERC20Token(*address* `_tokenAddress`, *uint256* `_amount`)](#transferanyerc20tokenaddress-_tokenaddress-uint256-_amount)
    * [allowance(*address* `_owner`, *address* `_spender`)](#allowanceaddress-_owner-address-_spender)

# ColuLocalNetwork

### Colu Local Network contract.

- **Author**: Tal Beja.
- **Constructor**: ColuLocalNetwork(*uint256* `_totalSupply`)
- This contract does **not** have a fallback function.

## ColuLocalNetwork Accessors

* *string* name() `06fdde03`
* *uint256* totalSupply() `18160ddd`
* *bool* isTransferable() `2121dc75`
* *uint8* decimals() `313ce567`
* *address* owner() `8da5cb5b`
* *string* symbol() `95d89b41`
* *address* newOwnerCandidate() `d091b550`

## ColuLocalNetwork Events

### TokensTransferable()

**Signature hash**: `a693ca1b20114bcad5861562c3007eb477c4926f79219f624bdbfde146fd2b64`

### OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)

**Signature hash**: `13a4b3bc0d5234dd3d87c9f1557d8faefa37986da62c36ba49309e2fb2c9aec4`

### OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)

**Signature hash**: `8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0`

### Approval(*address* indexed `owner`, *address* indexed `spender`, *uint256* `value`)

**Signature hash**: `8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925`

### Transfer(*address* indexed `from`, *address* indexed `to`, *uint256* `value`)

**Signature hash**: `ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`

### TransferAndCall(*address* indexed `from`, *address* indexed `to`, *uint256* `value`, *bytes* `data`)

**Signature hash**: `ce8124fd2ae9fd7904103e5a9ebe88b527b9ca0e32a32fd497845c82706542d3`

## ColuLocalNetwork Functions

### requestOwnershipTransfer(*address* `_newOwnerCandidate`)

- **State mutability**: `nonpayable`
- **Signature hash**: `0952c504`

Proposes to transfer control of the contract to a newOwnerCandidate.

#### Inputs

| type      | name                 | description                                   |
| --------- | -------------------- | --------------------------------------------- |
| *address* | `_newOwnerCandidate` | address The address to transfer ownership to. |

### approve(*address* `_spender`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `095ea7b3`

Same ERC20 behavior, but reverts if not transferable.

#### Inputs

| type      | name       | description                                     |
| --------- | ---------- | ----------------------------------------------- |
| *address* | `_spender` | address The address which will spend the funds. |
| *uint256* | `_value`   | uint256 The amount of tokens to be spent.       |

#### Outputs

| type   |
| ------ |
| *bool* |

### transferFrom(*address* `_from`, *address* `_to`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `23b872dd`

Same ERC20 behavior, but reverts if not transferable.

#### Inputs

| type      | name     | description                                     |
| --------- | -------- | ----------------------------------------------- |
| *address* | `_from`  | address The address to send tokens from.        |
| *address* | `_to`    | address The address to transfer to.             |
| *uint256* | `_value` | uint256 the amount of tokens to be transferred. |

#### Outputs

| type   |
| ------ |
| *bool* |

### transferAndCall(*address* `_to`, *uint256* `_value`, *bytes* `_data`)

- **State mutability**: `nonpayable`
- **Signature hash**: `4000aea0`

Same ERC677 behavior, but reverts if not transferable.

#### Inputs

| type      | name     | description                                         |
| --------- | -------- | --------------------------------------------------- |
| *address* | `_to`    | address The address to transfer to.                 |
| *uint256* | `_value` | uint256 The amount to be transferred.               |
| *bytes*   | `_data`  | bytes data to send to receiver if it is a contract. |

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |

### makeTokensTransferable()

- **State mutability**: `nonpayable`
- **Signature hash**: `5348ac95`

start transferable mode.

### balanceOf(*address* `_owner`)

- **State mutability**: `view`
- **Signature hash**: `70a08231`

Gets the balance of the specified address.

#### Inputs

| type      | name     | description                                      |
| --------- | -------- | ------------------------------------------------ |
| *address* | `_owner` | address The address to query the the balance of. |

#### Outputs

| type      | name      | description                                                  |
| --------- | --------- | ------------------------------------------------------------ |
| *uint256* | `balance` | uint256 representing the amount owned by the passed address. |

### acceptOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `79ba5097`

Accept ownership transfer. This method needs to be called by the perviously proposed owner.

### transfer(*address* `_to`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `a9059cbb`

Same ERC20 behavior, but reverts if not transferable.

#### Inputs

| type      | name     | description                           |
| --------- | -------- | ------------------------------------- |
| *address* | `_to`    | address The address to transfer to.   |
| *uint256* | `_value` | uint256 The amount to be transferred. |

#### Outputs

| type   |
| ------ |
| *bool* |

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

### allowance(*address* `_owner`, *address* `_spender`)

- **State mutability**: `view`
- **Signature hash**: `dd62ed3e`

Function to check the amount of tokens that an owner allowed to a spender.

#### Inputs

| type      | name       | description                                     |
| --------- | ---------- | ----------------------------------------------- |
| *address* | `_owner`   | address The address which owns the funds.       |
| *address* | `_spender` | address The address which will spend the funds. |

#### Outputs

| type      | name        | description                                                              |
| --------- | ----------- | ------------------------------------------------------------------------ |
| *uint256* | `remaining` | uint256 specifying the amount of tokens still available for the spender. |
