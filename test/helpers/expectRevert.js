module.exports = async (promise) => {
    try {
        await promise;
    } catch (error) {
        const invalidOpcode = error.message.search('invalid opcode') > -1;
        const outOfGas = error.message.search('out of gas') > -1;
        const revert = error.message.search('revert') > -1;
        const cantStore = error.message.search('couldn\'t be stored') > -1;
        const invalidJSON = error.message.search('Invalid JSON RPC response') > -1;

        assert(invalidOpcode || outOfGas || revert || cantStore || invalidJSON, `Expected throw, got ${error} instead`);

        return;
    }

    assert(false, "Expected throw wasn't received");
};