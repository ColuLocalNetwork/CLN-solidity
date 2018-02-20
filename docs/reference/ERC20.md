* [ERC20](#erc20)
  * [Accessors](#erc20-accessors)
  * [Events](#erc20-events)
    * [Transfer(*address* indexed `from`, *address* indexed `to`, *uint256* `value`)](#transferaddress-indexed-from-address-indexed-to-uint256-value)
    * [Approval(*address* indexed `owner`, *address* indexed `spender`, *uint256* `value`)](#approvaladdress-indexed-owner-address-indexed-spender-uint256-value)
  * [Functions](#erc20-functions)
    * [approve(*address* `_spender`, *uint256* `_value`)](#approveaddress-_spender-uint256-_value)
    * [transferFrom(*address* `_from`, *address* `_to`, *uint256* `_value`)](#transferfromaddress-_from-address-_to-uint256-_value)
    * [balanceOf(*address* `_owner`)](#balanceofaddress-_owner)
    * [transfer(*address* `_to`, *uint256* `_value`)](#transferaddress-_to-uint256-_value)
    * [allowance(*address* `_owner`, *address* `_spender`)](#allowanceaddress-_owner-address-_spender)

# ERC20

### ERC Token Standard #20 Interface (https://github.com/ethereum/EIPs/issues/20)

- **Constructor**: ERC20()
- This contract does **not** have a fallback function.

## ERC20 Accessors

* *uint256* totalSupply() `18160ddd`

## ERC20 Events

### Transfer(*address* indexed `from`, *address* indexed `to`, *uint256* `value`)

**Signature hash**: `ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`

### Approval(*address* indexed `owner`, *address* indexed `spender`, *uint256* `value`)

**Signature hash**: `8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925`

## ERC20 Functions

### approve(*address* `_spender`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `095ea7b3`

#### Inputs

| type      | name       |
| --------- | ---------- |
| *address* | `_spender` |
| *uint256* | `_value`   |

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |

### transferFrom(*address* `_from`, *address* `_to`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `23b872dd`

#### Inputs

| type      | name     |
| --------- | -------- |
| *address* | `_from`  |
| *address* | `_to`    |
| *uint256* | `_value` |

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |

### balanceOf(*address* `_owner`)

- **State mutability**: `view`
- **Signature hash**: `70a08231`

#### Inputs

| type      | name     |
| --------- | -------- |
| *address* | `_owner` |

#### Outputs

| type      | name      |
| --------- | --------- |
| *uint256* | `balance` |

### transfer(*address* `_to`, *uint256* `_value`)

- **State mutability**: `nonpayable`
- **Signature hash**: `a9059cbb`

#### Inputs

| type      | name     |
| --------- | -------- |
| *address* | `_to`    |
| *uint256* | `_value` |

#### Outputs

| type   | name      |
| ------ | --------- |
| *bool* | `success` |

### allowance(*address* `_owner`, *address* `_spender`)

- **State mutability**: `view`
- **Signature hash**: `dd62ed3e`

#### Inputs

| type      | name       |
| --------- | ---------- |
| *address* | `_owner`   |
| *address* | `_spender` |

#### Outputs

| type      | name        |
| --------- | ----------- |
| *uint256* | `remaining` |
