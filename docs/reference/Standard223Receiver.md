* [Standard223Receiver](#standard223receiver)
  * [Functions](#standard223receiver-functions)
    * [supportsToken(*address* `token`)](#supportstokenaddress-token)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)

# Standard223Receiver

### Standard ERC223 Token Receiver implementing tokenFallback function and tokenPayable modifier

- **Constructor**: Standard223Receiver()
- This contract does **not** have a fallback function.

## Standard223Receiver Functions

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
