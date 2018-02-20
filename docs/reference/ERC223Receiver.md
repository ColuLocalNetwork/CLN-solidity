* [ERC223Receiver](#erc223receiver)
  * [Functions](#erc223receiver-functions)
    * [tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)](#tokenfallbackaddress-_sender-uint256-_value-bytes-_data)

# ERC223Receiver

### ERC223Receiver Interface

- **Constructor**: ERC223Receiver()
- This contract does **not** have a fallback function.

## ERC223Receiver Functions

### tokenFallback(*address* `_sender`, *uint256* `_value`, *bytes* `_data`)

- **State mutability**: `nonpayable`
- **Signature hash**: `c0ee0b8a`

#### Inputs

| type      | name      |
| --------- | --------- |
| *address* | `_sender` |
| *uint256* | `_value`  |
| *bytes*   | `_data`   |

#### Outputs

| type   | name |
| ------ | ---- |
| *bool* | `ok` |
