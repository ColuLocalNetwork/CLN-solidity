const coder = require('web3-eth-abi');

const VESTING_ABI = {
    name: 'batchUnlockVestedTokens',
    type: 'function',
    inputs: [
        {
            type: 'address[]',
            name: 'addresses'
        }
    ]
}

const PARTICIPATE_ABI = {
    name: 'participate',
    type: 'function',
    inputs: [
        {
            type: 'address',
            name: 'token'
        }
    ]
}

const REFUND_ABI = {
    name: 'refund',
    type: 'function',
    inputs: [
        // {
        //     type: 'address',
        //     name: 'token'
        // }
    ]
}

const TRANSFERANDCALL_ABI = {
    name: 'transferAndCall',
    type: 'function',
    inputs: [
        {
            type: 'address',
            name: 'to'
        }, 
        {
            type: 'uint256',
            name: 'value'
        },
        {
            type: 'bytes',
            name: 'data'
        }
    ]   
}

// const encodeData = (refund, token) => {
//     let abi, params;
//     if (!refund) {
//         abi = PARTICIPATE_ABI;
//         //console.log('encoding INSERT_TO_MM_AND_TRANSFER_WITH_MIN_ABI')
//         params = [token];
//     } else {
//         abi = REFUND_ABI;
//         params = [];
//     }
//     return coder.encodeFunctionCall(abi, params);
// }

// const encodeTransferAndCall = (to, value, data) => {
//   return coder.encodeFunctionCall(TRANSFERANDCALL_ABI, [to, value, data]);   
// }

// let innerData = encodeData(false, '0x9e4fdb53e43ed037094fdfb7997705249b5cec62')
// console.log('innerData', innerData)

// let allData = encodeTransferAndCall('0xa23A005c5bAd2fD7E54D990C7c4cF9cdC3E86235', "1000000000000000000000", innerData);
// console.log('allData', allData)

let abi = VESTING_ABI;
let params = [["0x2c8187a6d6bef6b4cfb77d2ed0d06071791b732d","0xdd09f9d9c917d0ed79491f2335f2f229cb7f21ec","0xcd055b1a2eda73d6e5d545e49ad1aec9bafb8064","0xfe63e0209dafe7745f84784ec6cca5235a6dbdde","0xfe63e0209dafe7745f84784ec6cca5235a6dbdde","0x6ba4597c0f48c05b593b77104198c697309c4193","0x2b1699b45cd1ba9cbe0213012343d51e520be5ba","0xf89752ffee354b49179337e1cf39b2c9a6a3b34c","0xcbbc252ae247fbb4b8d728842c2fa069e91cce54","0x7005151416f556687cdcffbec8a70b59810f695b","0x7b90c4fe2ebe18f7db957d180156b33c0d8124f2","0x3cbcff411b74fa71309667555bdaf5f4733dc226","0xf5eb080146a0810d09ccf301e7ca376a1e9b9be5","0x813697292505a00af96d4a69e5650c3371cff4e6","0x204d19c23f7a4aaab98d6426c563e0f34f6a666b","0x29d289e09e855808b1034470ce9edcd8ed66290e","0x16cfa05f71438c0bf48ef30748ca8017d2322551","0xb2abc09df99340d6f729ad6066e1ec682de10d16","0x3b2403cbb09cacda071d972727fa7a47f72dc14f","0xd68a3bfdc48f51ec2c56ed1c01e3fec945b19182","0xc280f35eeb97564dfd6bf80722e031d8f5bd82c9","0xc6ac4bdc07fe49390e1b1d4a8d2eb8ba58ea3fab","0x6fea170eecdf3738a0652aef50840ecbcf70bd68","0x0ad55adc930d142496f2a46358fa7306a6295763","0x1bc6ee3d40ce07c29db65c6cf4269e1089d16e07","0xd64276cb86e9c820f8acb93b3bfa945bc275da85","0x61b38aabc307e1ff0a9b68595eaed70f3e655152","0xe697105efccc32552e773a4f9fc646a6e06b8fd9","0xc1f1d679bce74fa8f38ba34685eacc00809f05ea","0x2923a4db03166d83380d1fa4b268c1195f8934e1","0xa91bff307469c33ded0ceb0cc42e0828c153035e","0x2b7bc85e2eea74aef4a333d1b4ef339fbc6d913e","0x20a785ab373f7406314ea8245d9b57e2e6c0381c","0x6a667037c583518b7ec97c6adaac9ea52a952c7b","0x2c82c3915b751f0ae26e4cb2a4a64c88e75108eb","0x382512c377d25add50679bae421d52488ef1bcd2","0xacdba8c99e975030ec8df5e52effffca98c6ff18","0xb5d8f196a1e0357332c0d86f1d75bba19910386f"]]

console.log(coder.encodeFunctionCall(abi, params));