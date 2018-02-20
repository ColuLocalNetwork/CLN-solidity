* [MultiSigWalletMock](#multisigwalletmock)
  * [Accessors](#multisigwalletmock-accessors)
  * [Events](#multisigwalletmock-events)
    * [Confirmation(*address* indexed `sender`, *uint256* indexed `transactionId`)](#confirmationaddress-indexed-sender-uint256-indexed-transactionid)
    * [Revocation(*address* indexed `sender`, *uint256* indexed `transactionId`)](#revocationaddress-indexed-sender-uint256-indexed-transactionid)
    * [Submission(*uint256* indexed `transactionId`)](#submissionuint256-indexed-transactionid)
    * [Execution(*uint256* indexed `transactionId`)](#executionuint256-indexed-transactionid)
    * [ExecutionFailure(*uint256* indexed `transactionId`)](#executionfailureuint256-indexed-transactionid)
    * [Deposit(*address* indexed `sender`, *uint256* `value`)](#depositaddress-indexed-sender-uint256-value)
    * [OwnerAddition(*address* indexed `owner`)](#owneradditionaddress-indexed-owner)
    * [OwnerRemoval(*address* indexed `owner`)](#ownerremovaladdress-indexed-owner)
    * [RequirementChange(*uint256* `required`)](#requirementchangeuint256-required)
  * [Functions](#multisigwalletmock-functions)
    * [removeOwner(*address* `owner`)](#removeowneraddress-owner)
    * [revokeConfirmation(*uint256* `transactionId`)](#revokeconfirmationuint256-transactionid)
    * [getTransactionCount(*bool* `pending`, *bool* `executed`)](#gettransactioncountbool-pending-bool-executed)
    * [addOwner(*address* `owner`)](#addowneraddress-owner)
    * [isConfirmed(*uint256* `transactionId`)](#isconfirmeduint256-transactionid)
    * [getConfirmationCount(*uint256* `transactionId`)](#getconfirmationcountuint256-transactionid)
    * [transactions(*uint256*)](#transactionsuint256)
    * [getOwners()](#getowners)
    * [getTransactionIds(*uint256* `from`, *uint256* `to`, *bool* `pending`, *bool* `executed`)](#gettransactionidsuint256-from-uint256-to-bool-pending-bool-executed)
    * [getConfirmations(*uint256* `transactionId`)](#getconfirmationsuint256-transactionid)
    * [changeRequirement(*uint256* `_required`)](#changerequirementuint256-_required)
    * [confirmTransaction(*uint256* `transactionId`)](#confirmtransactionuint256-transactionid)
    * [submitTransaction(*address* `_destination`, *uint256* `_value`, *bytes* `_data`)](#submittransactionaddress-_destination-uint256-_value-bytes-_data)
    * [replaceOwner(*address* `owner`, *address* `newOwner`)](#replaceowneraddress-owner-address-newowner)
    * [executeTransaction(*uint256* `transactionId`)](#executetransactionuint256-transactionid)

# MultiSigWalletMock

- **Constructor**: MultiSigWalletMock(*address[]* `_owners`, *uint8* `_required`)
- This contract has a `payable` fallback function.

## MultiSigWalletMock Accessors

* *address* owners(*uint256*) `025e7c27`
* *bool* isOwner(*address*) `2f54bf6e`
* *bool* confirmations(*uint256*, *address*) `3411c81c`
* *uint256* transactionId() `7e2f42e7`
* *uint256* transactionCount() `b77bf600`
* *uint256* MAX_OWNER_COUNT() `d74f8edd`
* *uint256* required() `dc8452cd`

## MultiSigWalletMock Events

### Confirmation(*address* indexed `sender`, *uint256* indexed `transactionId`)

**Signature hash**: `4a504a94899432a9846e1aa406dceb1bcfd538bb839071d49d1e5e23f5be30ef`

### Revocation(*address* indexed `sender`, *uint256* indexed `transactionId`)

**Signature hash**: `f6a317157440607f36269043eb55f1287a5a19ba2216afeab88cd46cbcfb88e9`

### Submission(*uint256* indexed `transactionId`)

**Signature hash**: `c0ba8fe4b176c1714197d43b9cc6bcf797a4a7461c5fe8d0ef6e184ae7601e51`

### Execution(*uint256* indexed `transactionId`)

**Signature hash**: `33e13ecb54c3076d8e8bb8c2881800a4d972b792045ffae98fdf46df365fed75`

### ExecutionFailure(*uint256* indexed `transactionId`)

**Signature hash**: `526441bb6c1aba3c9a4a6ca1d6545da9c2333c8c48343ef398eb858d72b79236`

### Deposit(*address* indexed `sender`, *uint256* `value`)

**Signature hash**: `e1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c`

### OwnerAddition(*address* indexed `owner`)

**Signature hash**: `f39e6e1eb0edcf53c221607b54b00cd28f3196fed0a24994dc308b8f611b682d`

### OwnerRemoval(*address* indexed `owner`)

**Signature hash**: `8001553a916ef2f495d26a907cc54d96ed840d7bda71e73194bf5a9df7a76b90`

### RequirementChange(*uint256* `required`)

**Signature hash**: `a3f1ee9126a074d9326c682f561767f710e927faa811f7a99829d49dc421797a`

## MultiSigWalletMock Functions

### removeOwner(*address* `owner`)

- **State mutability**: `nonpayable`
- **Signature hash**: `173825d9`

Allows to remove an owner. Transaction has to be sent by wallet.

#### Inputs

| type      | name    | description       |
| --------- | ------- | ----------------- |
| *address* | `owner` | Address of owner. |

### revokeConfirmation(*uint256* `transactionId`)

- **State mutability**: `nonpayable`
- **Signature hash**: `20ea8d86`

Allows an owner to revoke a confirmation for a transaction.

#### Inputs

| type      | name            | description     |
| --------- | --------------- | --------------- |
| *uint256* | `transactionId` | Transaction ID. |

### getTransactionCount(*bool* `pending`, *bool* `executed`)

- **State mutability**: `view`
- **Signature hash**: `54741525`

Returns total number of transactions after filers are applied.

#### Inputs

| type   | name       | description                    |
| ------ | ---------- | ------------------------------ |
| *bool* | `pending`  | Include pending transactions.  |
| *bool* | `executed` | Include executed transactions. |

#### Outputs

| type      | name    | description                                             |
| --------- | ------- | ------------------------------------------------------- |
| *uint256* | `count` | Total number of transactions after filters are applied. |

### addOwner(*address* `owner`)

- **State mutability**: `nonpayable`
- **Signature hash**: `7065cb48`

Allows to add a new owner. Transaction has to be sent by wallet.

#### Inputs

| type      | name    | description           |
| --------- | ------- | --------------------- |
| *address* | `owner` | Address of new owner. |

### isConfirmed(*uint256* `transactionId`)

- **State mutability**: `view`
- **Signature hash**: `784547a7`

Returns the confirmation status of a transaction.

#### Inputs

| type      | name            | description     |
| --------- | --------------- | --------------- |
| *uint256* | `transactionId` | Transaction ID. |

#### Outputs

| type   | description          |
| ------ | -------------------- |
| *bool* | Confirmation status. |

### getConfirmationCount(*uint256* `transactionId`)

- **State mutability**: `view`
- **Signature hash**: `8b51d13f`

Returns number of confirmations of a transaction.

#### Inputs

| type      | name            | description     |
| --------- | --------------- | --------------- |
| *uint256* | `transactionId` | Transaction ID. |

#### Outputs

| type      | name    | description              |
| --------- | ------- | ------------------------ |
| *uint256* | `count` | Number of confirmations. |

### transactions(*uint256*)

- **State mutability**: `view`
- **Signature hash**: `9ace38c2`

#### Inputs

| type      |
| --------- |
| *uint256* |

#### Outputs

| type      | name          |
| --------- | ------------- |
| *address* | `destination` |
| *uint256* | `value`       |
| *bytes*   | `data`        |
| *bool*    | `executed`    |

### getOwners()

- **State mutability**: `view`
- **Signature hash**: `a0e67e2b`

Returns list of owners.

#### Outputs

| type        | description              |
| ----------- | ------------------------ |
| *address[]* | List of owner addresses. |

### getTransactionIds(*uint256* `from`, *uint256* `to`, *bool* `pending`, *bool* `executed`)

- **State mutability**: `view`
- **Signature hash**: `a8abe69a`

Returns list of transaction IDs in defined range.

#### Inputs

| type      | name       | description                                |
| --------- | ---------- | ------------------------------------------ |
| *uint256* | `from`     | Index start position of transaction array. |
| *uint256* | `to`       | Index end position of transaction array.   |
| *bool*    | `pending`  | Include pending transactions.              |
| *bool*    | `executed` | Include executed transactions.             |

#### Outputs

| type        | name              | description                       |
| ----------- | ----------------- | --------------------------------- |
| *uint256[]* | `_transactionIds` | Returns array of transaction IDs. |

### getConfirmations(*uint256* `transactionId`)

- **State mutability**: `view`
- **Signature hash**: `b5dc40c3`

Returns array with owner addresses, which confirmed transaction.

#### Inputs

| type      | name            | description     |
| --------- | --------------- | --------------- |
| *uint256* | `transactionId` | Transaction ID. |

#### Outputs

| type        | name             | description                       |
| ----------- | ---------------- | --------------------------------- |
| *address[]* | `_confirmations` | Returns array of owner addresses. |

### changeRequirement(*uint256* `_required`)

- **State mutability**: `nonpayable`
- **Signature hash**: `ba51a6df`

Allows to change the number of required confirmations. Transaction has to be sent by wallet.

#### Inputs

| type      | name        | description                       |
| --------- | ----------- | --------------------------------- |
| *uint256* | `_required` | Number of required confirmations. |

### confirmTransaction(*uint256* `transactionId`)

- **State mutability**: `nonpayable`
- **Signature hash**: `c01a8c84`

Allows an owner to confirm a transaction.

#### Inputs

| type      | name            | description     |
| --------- | --------------- | --------------- |
| *uint256* | `transactionId` | Transaction ID. |

### submitTransaction(*address* `_destination`, *uint256* `_value`, *bytes* `_data`)

- **State mutability**: `nonpayable`
- **Signature hash**: `c6427474`

#### Inputs

| type      | name           |
| --------- | -------------- |
| *address* | `_destination` |
| *uint256* | `_value`       |
| *bytes*   | `_data`        |

#### Outputs

| type      | name             |
| --------- | ---------------- |
| *uint256* | `_transactionId` |

### replaceOwner(*address* `owner`, *address* `newOwner`)

- **State mutability**: `nonpayable`
- **Signature hash**: `e20056e6`

Allows to replace an owner with a new owner. Transaction has to be sent by wallet.

#### Inputs

| type      | name       | description                      |
| --------- | ---------- | -------------------------------- |
| *address* | `owner`    | Address of owner to be replaced. |
| *address* | `newOwner` | Address of new owner.            |

### executeTransaction(*uint256* `transactionId`)

- **State mutability**: `nonpayable`
- **Signature hash**: `ee22610b`

Allows anyone to execute a confirmed transaction.

#### Inputs

| type      | name            | description     |
| --------- | --------------- | --------------- |
| *uint256* | `transactionId` | Transaction ID. |
