* [Standard677Token](#standard677token)
  * [Accessors](#standard677token-accessors)
  * [Events](#standard677token-events)
    * [Approval(*address* indexed `owner`, *address* indexed `spender`, *uint256* `value`)](#approvaladdress-indexed-owner-address-indexed-spender-uint256-value)
    * [Transfer(*address* indexed `from`, *address* indexed `to`, *uint256* `value`)](#transferaddress-indexed-from-address-indexed-to-uint256-value)
    * [TransferAndCall(*address* indexed `from`, *address* indexed `to`, *uint256* `value`, *bytes* `data`)](#transferandcalladdress-indexed-from-address-indexed-to-uint256-value-bytes-data)
  * [Functions](#standard677token-functions)
    * [approve(*address* `_spender`, *uint256* `_value`)](#approveaddress-_spender-uint256-_value)
    * [transferFrom(*address* `_from`, *address* `_to`, *uint256* `_value`)](#transferfromaddress-_from-address-_to-uint256-_value)
    * [transferAndCall(*address* `_to`, *uint256* `_value`, *bytes* `_data`)](#transferandcalladdress-_to-uint256-_value-bytes-_data)
    * [balanceOf(*address* `_owner`)](#balanceofaddress-_owner)
    * [transfer(*address* `_to`, *uint256* `_value`)](#transferaddress-_to-uint256-_value)
    * [allowance(*address* `_owner`, *address* `_spender`)](#allowanceaddress-_owner-address-_spender)

# Standard677Token

### Standard677Token implentation, base on https://github.com/ethereum/EIPs/issues/677

- **Constructor**: Standard677Token()
- This contract does **not** have a fallback function.

## Standard677Token Accessors

* *uint256* totalSupply() `18160ddd`

## Standard677Token Events

### Approval(*address* indexed `owner`, *address* indexed `spender`, *uint256* `value`)

**Signature hash**: `8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925`

### Transfer(*address* indexed `from`, *address* indexed `to`, *uint256* `value`)

**Signature hash**: `ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`

### TransferAndCall(*address* indexed `from`, *address* indexed `to`, *uint256* `value`, *bytes* `data`)

**Signature hash**: `ce8124fd2ae9fd7904103e5a9ebe88b527b9ca0e32a32fd497845c82706542d3`

## Standard677Token Functions

### approve(*address* `_spender`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `095ea7b3`

Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.

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

Transfer tokens from one address to another.

#### Inputs

| type      | name     | description                                             |
| --------- | -------- | ------------------------------------------------------- |
| *address* | `_from`  | address The address which you want to send tokens from. |
| *address* | `_to`    | address The address which you want to transfer to.      |
| *uint256* | `_value` | uint256 the amount of tokens to be transferred.         |

#### Outputs

| type   |
| ------ |
| *bool* |

### transferAndCall(*address* `_to`, *uint256* `_value`, *bytes* `_data`)

- **State mutability**: `nonpayable`
- **Signature hash**: `4000aea0`

ERC223 safe token transfer from one address to another

#### Inputs

| type      | name     | description                                             |
| --------- | -------- | ------------------------------------------------------- |
| *address* | `_to`    | address the address which you want to transfer to.      |
| *uint256* | `_value` | uint256 the amount of tokens to be transferred.         |
| *bytes*   | `_data`  | bytes data that can be attached to the token transation |

#### Outputs

| type   |
| ------ |
| *bool* |

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

### transfer(*address* `_to`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `a9059cbb`

Transfer token to a specified address.

#### Inputs

| type      | name     | description                           |
| --------- | -------- | ------------------------------------- |
| *address* | `_to`    | address The address to transfer to.   |
| *uint256* | `_value` | uint256 The amount to be transferred. |

#### Outputs

| type   |
| ------ |
| *bool* |

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
