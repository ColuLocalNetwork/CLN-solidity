* [VestingTrustee](#vestingtrustee)
  * [Accessors](#vestingtrustee-accessors)
  * [Events](#vestingtrustee-events)
    * [NewGrant(*address* indexed `_from`, *address* indexed `_to`, *uint256* `_value`)](#newgrantaddress-indexed-_from-address-indexed-_to-uint256-_value)
    * [TokensUnlocked(*address* indexed `_to`, *uint256* `_value`)](#tokensunlockedaddress-indexed-_to-uint256-_value)
    * [GrantRevoked(*address* indexed `_holder`, *uint256* `_refund`)](#grantrevokedaddress-indexed-_holder-uint256-_refund)
    * [Error(*address* indexed `sender`, *uint256* `error`)](#erroraddress-indexed-sender-uint256-error)
    * [OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)](#ownershiprequestedaddress-indexed-_by-address-indexed-_to)
    * [OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)](#ownershiptransferredaddress-indexed-_from-address-indexed-_to)
  * [Functions](#vestingtrustee-functions)
    * [supportsToken(*address* `token`)](#supportstokenaddress-token)
    * [requestOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestownershiptransferaddress-_newownercandidate)
    * [vestedTokens(*address* `_holder`, *uint256* `_time`)](#vestedtokensaddress-_holder-uint256-_time)
    * [batchUnlockVestedTokens(*address[]* `_grantees`)](#batchunlockvestedtokensaddress-_grantees)
    * [grant(*address* `_to`, *uint256* `_start`, *uint256* `_cliff`, *uint256* `_end`, *uint256* `_installmentLength`, *bool* `_revokable`)](#grantaddress-_to-uint256-_start-uint256-_cliff-uint256-_end-uint256-_installmentlength-bool-_revokable)
    * [readyTokens(*address* `_holder`)](#readytokensaddress-_holder)
    * [revoke(*address* `_holder`)](#revokeaddress-_holder)
    * [acceptOwnership()](#acceptownership)
    * [unlockVestedTokens()](#unlockvestedtokens)
    * [grant(*address* `_to`, *uint256* `_value`, *uint256* `_start`, *uint256* `_cliff`, *uint256* `_end`, *uint256* `_installmentLength`, *bool* `_revokable`)](#grantaddress-_to-uint256-_value-uint256-_start-uint256-_cliff-uint256-_end-uint256-_installmentlength-bool-_revokable)
    * [withdrawERC20(*address* `_tokenAddress`, *uint256* `_amount`)](#withdrawerc20address-_tokenaddress-uint256-_amount)
    * [grants(*address*)](#grantsaddress)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)

# VestingTrustee

### Vesting trustee contract for Colu Local Network.

- **Constructor**: VestingTrustee(*address* `_cln`)
- This contract does **not** have a fallback function.

## VestingTrustee Accessors

* *uint256* totalVesting() `7c17357d`
* *address* owner() `8da5cb5b`
* *address* cln() `90604005`
* *address* newOwnerCandidate() `d091b550`

## VestingTrustee Events

### NewGrant(*address* indexed `_from`, *address* indexed `_to`, *uint256* `_value`)

**Signature hash**: `fabf00c3717e5e33d6fcc433d4d70ef919a4101fb7d5c444fe349927034eaa45`

### TokensUnlocked(*address* indexed `_to`, *uint256* `_value`)

**Signature hash**: `e7b379c6c1fa169e9079c25e9143b127637eef8ec8c9d5c06ddb4ab3e1195888`

### GrantRevoked(*address* indexed `_holder`, *uint256* `_refund`)

**Signature hash**: `740528a7c317c81f0923adc30df75db3f448298c78cdaf548adfcfdb3c84ff6f`

### Error(*address* indexed `sender`, *uint256* `error`)

**Signature hash**: `9cf38cf2dbf9139f5c32639950507b10775fbbe0421f3e168bc2d1bb1ae3208c`

### OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)

**Signature hash**: `13a4b3bc0d5234dd3d87c9f1557d8faefa37986da62c36ba49309e2fb2c9aec4`

### OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)

**Signature hash**: `8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0`

## VestingTrustee Functions

### supportsToken(*address* `token`)

- **State mutability**: `view`
- **Signature hash**: `061f7650`

Allow only cln token to be tokenPayable

#### Inputs

| type      | name    | description        |
| --------- | ------- | ------------------ |
| *address* | `token` | the token to check |

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

### vestedTokens(*address* `_holder`, *uint256* `_time`)

- **State mutability**: `view`
- **Signature hash**: `1a64adae`

Calculate the total amount of vested tokens of a holder at a given time.

#### Inputs

| type      | name      | description                                     |
| --------- | --------- | ----------------------------------------------- |
| *address* | `_holder` | address The address of the holder.              |
| *uint256* | `_time`   | uint256 The specific time to calculate against. |

#### Outputs

| type      | description                                                      |
| --------- | ---------------------------------------------------------------- |
| *uint256* | a uint256 Representing a holder's total amount of vested tokens. |

### batchUnlockVestedTokens(*address[]* `_grantees`)

- **State mutability**: `nonpayable`
- **Signature hash**: `1e075aba`

batchUnlockVestedTokens vested tokens and transfer them to the grantees.

#### Inputs

| type        | name        | description                              |
| ----------- | ----------- | ---------------------------------------- |
| *address[]* | `_grantees` | address[] The addresses of the grantees. |

#### Outputs

| type   | name      | description       |
| ------ | --------- | ----------------- |
| *bool* | `success` | a boo if success. |

### grant(*address* `_to`, *uint256* `_start`, *uint256* `_cliff`, *uint256* `_end`, *uint256* `_installmentLength`, *bool* `_revokable`)

- **State mutability**: `nonpayable`
- **Signature hash**: `5ee7e96d`

Grant tokens to a specified address.

#### Inputs

| type      | name                 | description                                                  |
| --------- | -------------------- | ------------------------------------------------------------ |
| *address* | `_to`                | address The holder address.                                  |
| *uint256* | `_start`             | uint256 The beginning of the vesting period (timestamp).     |
| *uint256* | `_cliff`             | uint256 When the first installment is made (timestamp).      |
| *uint256* | `_end`               | uint256 The end of the vesting period (timestamp).           |
| *uint256* | `_installmentLength` | uint256 The length of each vesting installment (in seconds). |
| *bool*    | `_revokable`         | bool Whether the grant is revokable or not.                  |

### readyTokens(*address* `_holder`)

- **State mutability**: `view`
- **Signature hash**: `6bfa379e`

Calculate the amount of ready tokens of a holder.

#### Inputs

| type      | name      | description                        |
| --------- | --------- | ---------------------------------- |
| *address* | `_holder` | address The address of the holder. |

#### Outputs

| type      | description                                                      |
| --------- | ---------------------------------------------------------------- |
| *uint256* | a uint256 Representing a holder's total amount of vested tokens. |

### revoke(*address* `_holder`)

- **State mutability**: `nonpayable`
- **Signature hash**: `74a8f103`

Revoke the grant of tokens of a specifed address.Unlocked tokens will be sent to the grantee, the rest is transferred to the trustee's owner.

#### Inputs

| type      | name      | description                                     |
| --------- | --------- | ----------------------------------------------- |
| *address* | `_holder` | The address which will have its tokens revoked. |

### acceptOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `79ba5097`

Accept ownership transfer. This method needs to be called by the perviously proposed owner.

### unlockVestedTokens()

- **State mutability**: `nonpayable`
- **Signature hash**: `83fcf973`

Unlock vested tokens and transfer them to the grantee.

#### Outputs

| type      | description                       |
| --------- | --------------------------------- |
| *uint256* | a uint The success or error code. |

### grant(*address* `_to`, *uint256* `_value`, *uint256* `_start`, *uint256* `_cliff`, *uint256* `_end`, *uint256* `_installmentLength`, *bool* `_revokable`)

- **State mutability**: `nonpayable`
- **Signature hash**: `95792430`

Grant tokens to a specified address.

#### Inputs

| type      | name                 | description                                                  |
| --------- | -------------------- | ------------------------------------------------------------ |
| *address* | `_to`                | address The holder address.                                  |
| *uint256* | `_value`             | uint256 The amount of tokens to be granted.                  |
| *uint256* | `_start`             | uint256 The beginning of the vesting period (timestamp).     |
| *uint256* | `_cliff`             | uint256 When the first installment is made (timestamp).      |
| *uint256* | `_end`               | uint256 The end of the vesting period (timestamp).           |
| *uint256* | `_installmentLength` | uint256 The length of each vesting installment (in seconds). |
| *bool*    | `_revokable`         | bool Whether the grant is revokable or not.                  |

### withdrawERC20(*address* `_tokenAddress`, *uint256* `_amount`)

- **State mutability**: `nonpayable`
- **Signature hash**: `a1db9782`

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

### grants(*address*)

- **State mutability**: `view`
- **Signature hash**: `b869cea3`

#### Inputs

| type      |
| --------- |
| *address* |

#### Outputs

| type      | name                |
| --------- | ------------------- |
| *uint256* | `value`             |
| *uint256* | `start`             |
| *uint256* | `cliff`             |
| *uint256* | `end`               |
| *uint256* | `installmentLength` |
| *uint256* | `transferred`       |
| *bool*    | `revokable`         |

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
