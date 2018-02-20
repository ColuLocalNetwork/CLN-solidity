* [ColuLocalNetworkSale](#colulocalnetworksale)
  * [Accessors](#colulocalnetworksale-accessors)
  * [Events](#colulocalnetworksale-events)
    * [TokensIssued(*address* indexed `to`, *uint256* `tokens`)](#tokensissuedaddress-indexed-to-uint256-tokens)
    * [OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)](#ownershiprequestedaddress-indexed-_by-address-indexed-_to)
    * [OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)](#ownershiptransferredaddress-indexed-_from-address-indexed-_to)
  * [Functions](#colulocalnetworksale-functions)
    * [requestOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestownershiptransferaddress-_newownercandidate)
    * [presaleAllocation(*address* `_recipient`, *uint256* `_etherValue`, *uint8* `_vestingPlanIndex`)](#presaleallocationaddress-_recipient-uint256-_ethervalue-uint8-_vestingplanindex)
    * [finalize()](#finalize)
    * [vestingPlans(*uint256*)](#vestingplansuint256)
    * [setHardParticipationCap(*uint256* `_cap`)](#sethardparticipationcapuint256-_cap)
    * [acceptOwnership()](#acceptownership)
    * [initialize()](#initialize)
    * [setParticipationCap(*address[]* `_participants`, *uint256* `_cap`)](#setparticipationcapaddress-_participants-uint256-_cap)
    * [acceptColuLocalNetworkOwnership()](#acceptcolulocalnetworkownership)
    * [participate(*address* `_recipient`)](#participateaddress-_recipient)
    * [requestColuLocalNetworkOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestcolulocalnetworkownershiptransferaddress-_newownercandidate)
    * [requestVestingTrusteeOwnershipTransfer(*address* `_newOwnerCandidate`)](#requestvestingtrusteeownershiptransferaddress-_newownercandidate)
    * [acceptVestingTrusteeOwnership()](#acceptvestingtrusteeownership)
    * [transferAnyERC20Token(*address* `_tokenAddress`, *uint256* `_amount`)](#transferanyerc20tokenaddress-_tokenaddress-uint256-_amount)

# ColuLocalNetworkSale

### Colu Local Network sale contract.

- **Author**: Tal Beja.
- **Constructor**: ColuLocalNetworkSale(*address* `_owner`, *address* `_fundingRecipient`, *address* `_communityPoolAddress`, *address* `_futureDevelopmentPoolAddress`, *address* `_stakeholdersPoolAddress`, *uint256* `_startTime`)
- This contract has a `payable` fallback function.

## ColuLocalNetworkSale Accessors

* *bool* initialized() `158ef93e`
* *uint256* MAX_TOKENS_SOLD() `17f5de95`
* *address* fundingRecipient() `1bb534ba`
* *uint256* endTime() `3197cbb6`
* *uint256* presaleTokensSold() `341c3304`
* *uint256* participationHistory(*address*) `49432923`
* *uint256* tokensSold() `518ab2a8`
* *address* stakeholdersPoolAddress() `55b1182c`
* *uint256* CLN_PER_ETH() `5b3b20e1`
* *uint256* TOKEN_DECIMALS() `5b7f415c`
* *uint256* hardParticipationCap() `65b9e37d`
* *uint256* SALE_DURATION() `6d79207c`
* *uint256* FUTURE_DEVELOPMENT_POOL() `751ecea0`
* *uint256* participationCaps(*address*) `76e53221`
* *uint256* startTime() `78e97925`
* *uint256* STAKEHOLDERS_POOL() `7eddea21`
* *uint256* ALAP() `81030e35`
* *address* owner() `8da5cb5b`
* *address* cln() `90604005`
* *uint256* COMMUNITY_POOL() `aeb47e2a`
* *address* newOwnerCandidate() `d091b550`
* *uint256* MAX_PRESALE_TOKENS_SOLD() `e5514c9d`
* *address* communityPoolAddress() `ea02db0f`
* *address* futureDevelopmentPoolAddress() `ed3788c9`
* *uint256* MAX_TOKENS() `f47c84c5`
* *uint256* participationPresaleHistory(*address*) `fae95a71`
* *address* trustee() `fdf97cb2`

## ColuLocalNetworkSale Events

### TokensIssued(*address* indexed `to`, *uint256* `tokens`)

**Signature hash**: `21d739f160a7464fddaac4a1d1517d84e76b75618a053943b345c408c4160fe0`

### OwnershipRequested(*address* indexed `_by`, *address* indexed `_to`)

**Signature hash**: `13a4b3bc0d5234dd3d87c9f1557d8faefa37986da62c36ba49309e2fb2c9aec4`

### OwnershipTransferred(*address* indexed `_from`, *address* indexed `_to`)

**Signature hash**: `8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0`

## ColuLocalNetworkSale Functions

### requestOwnershipTransfer(*address* `_newOwnerCandidate`)

- **State mutability**: `nonpayable`
- **Signature hash**: `0952c504`

Proposes to transfer control of the contract to a newOwnerCandidate.

#### Inputs

| type      | name                 | description                                   |
| --------- | -------------------- | --------------------------------------------- |
| *address* | `_newOwnerCandidate` | address The address to transfer ownership to. |

### presaleAllocation(*address* `_recipient`, *uint256* `_etherValue`, *uint8* `_vestingPlanIndex`)

- **State mutability**: `nonpayable`
- **Signature hash**: `10ae4a73`

Allocate tokens to presale participant according to its vesting plan and invesment value.

#### Inputs

| type      | name                | description                                                    |
| --------- | ------------------- | -------------------------------------------------------------- |
| *address* | `_recipient`        | address The presale participant address to recieve the tokens. |
| *uint256* | `_etherValue`       | uint256 The invesment value (in ETH).                          |
| *uint8*   | `_vestingPlanIndex` | uint8 The vesting plan index.                                  |

### finalize()

- **State mutability**: `nonpayable`
- **Signature hash**: `4bb278f3`

Finalizes the token sale event: make future development pool grant (lockup) and make token transfarable.

### vestingPlans(*uint256*)

- **State mutability**: `view`
- **Signature hash**: `5a592380`

#### Inputs

| type      |
| --------- |
| *uint256* |

#### Outputs

| type      | name                |
| --------- | ------------------- |
| *uint256* | `startOffset`       |
| *uint256* | `cliffOffset`       |
| *uint256* | `endOffset`         |
| *uint256* | `installmentLength` |
| *uint8*   | `alapPercent`       |

### setHardParticipationCap(*uint256* `_cap`)

- **State mutability**: `nonpayable`
- **Signature hash**: `64329400`

Set hard participation cap for all participants.

#### Inputs

| type      | name   | description                  |
| --------- | ------ | ---------------------------- |
| *uint256* | `_cap` | uint256 The hard cap amount. |

### acceptOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `79ba5097`

Accept ownership transfer. This method needs to be called by the perviously proposed owner.

### initialize()

- **State mutability**: `nonpayable`
- **Signature hash**: `8129fc1c`

Initialize the sale conditions.

### setParticipationCap(*address[]* `_participants`, *uint256* `_cap`)

- **State mutability**: `nonpayable`
- **Signature hash**: `83d880d0`

Add a list of participants to a capped participation tier.

#### Inputs

| type        | name            | description                                  |
| ----------- | --------------- | -------------------------------------------- |
| *address[]* | `_participants` | address[] The list of participant addresses. |
| *uint256*   | `_cap`          | uint256 The cap amount (in ETH-WEI).         |

### acceptColuLocalNetworkOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `b3b4ec54`

Accepts new ownership on behalf of the Colu Local Network contract.

### participate(*address* `_recipient`)

- **State mutability**: `payable`
- **Signature hash**: `b91038c7`

Create and sell tokens to the caller.

#### Inputs

| type      | name         | description                                                |
| --------- | ------------ | ---------------------------------------------------------- |
| *address* | `_recipient` | address The address of the recipient receiving the tokens. |

### requestColuLocalNetworkOwnershipTransfer(*address* `_newOwnerCandidate`)

- **State mutability**: `nonpayable`
- **Signature hash**: `baa83568`

Requests to transfer control of the Colu Local Network contract to a new owner.

#### Inputs

| type      | name                 | description                                                                                                                                                                                                                                                                                                                                                                         |
| --------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *address* | `_newOwnerCandidate` | address The address to transfer ownership to.     /// NOTE:   1. The new owner will need to call Colu Local Network contract's acceptOwnership directly in order to accept the ownership.   2. Calling this method during the token sale will prevent the token sale to continue, since only the owner of      the Colu Local Network contract can transfer tokens during the sale. |

### requestVestingTrusteeOwnershipTransfer(*address* `_newOwnerCandidate`)

- **State mutability**: `nonpayable`
- **Signature hash**: `c28f9df1`

Requests to transfer control of the VestingTrustee contract to a new owner.

#### Inputs

| type      | name                 | description                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *address* | `_newOwnerCandidate` | address The address to transfer ownership to.     /// NOTE:   1. The new owner will need to call trustee contract's acceptOwnership directly in order to accept the ownership.   2. Calling this method during the token sale will prevent the token sale from alocation presale grunts add finalize, since only the owner of      the trustee contract can create grunts needed in the presaleAlocation add finalize methods. |

### acceptVestingTrusteeOwnership()

- **State mutability**: `nonpayable`
- **Signature hash**: `cfabe67b`

Accepts new ownership on behalf of the VestingTrustee contract. This can be used by the token sale contract itself to claim back ownership of the VestingTrustee contract.

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
