const web3GetFirstTransactionHashFromLastBlock = () => {
    return new Promise((resolve, reject) => {
      web3.eth.getBlock("latest", true, (err, res) => {
        if (err !== null) return reject(err);
        return resolve(res.transactions[0].hash);
      });
    });
}

const web3GetTransactionReceipt = (txid) => {
    return new Promise((resolve, reject) => {
      web3.eth.getTransactionReceipt(txid, (err, res) => {
        if (err !== null) return reject(err);
        return resolve(res);
      });
    });
}

module.exports = async (promise) => {
    let txHash;
     try {
       const tx = await promise;
       txHash = tx.tx;
     } catch (err) {
       // Make sure this is a revert (returned from EtherRouter)
       if ((err.message.indexOf("VM Exception while processing transaction: revert") === -1) &&
            err.message.indexOf("The contract code couldn't be stored, please check your gas amount")) {

            if (err.message.indexOf("invalid opcode") !== -1 || err.message.indexOf("Invalid JSON RPC response") !== -1) {
                return assert(true);
            }
            throw err;
       }


       txHash = await web3GetFirstTransactionHashFromLastBlock();
     }

     const receipt = await web3GetTransactionReceipt(txHash);
     // Check the receipt `status` to ensure transaction failed.
     assert.equal(receipt.status, 0x00, "Expected throw wasn't received");
};
