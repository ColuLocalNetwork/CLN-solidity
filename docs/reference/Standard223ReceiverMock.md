* [Standard223ReceiverMock](#standard223receivermock)
  * [Accessors](#standard223receivermock-accessors)
  * [Functions](#standard223receivermock-functions)
    * [supportsToken(*address* `token`)](#supportstokenaddress-token)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)

# Standard223ReceiverMock

- **Constructor**: Standard223ReceiverMock()
- This contract has a `nonpayable` fallback function.

## Standard223ReceiverMock Accessors

* *uint256* tokenValue() `1ec7e345`
* *bool* calledFallback() `390f6426`
* *address* tokenSender() `9898e18c`

## Standard223ReceiverMock Functions

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
