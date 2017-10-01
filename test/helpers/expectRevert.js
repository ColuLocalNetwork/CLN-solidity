module.exports = function (promise) {
    promise.then(function () {
        assert(false, "Expected throw wasn't received");
    }).catch(function (err) {
        // TODO: Check jump destination to destinguish between a throw and an actual invalid jump.
        var invalidOpcode = ~err.message.search('invalid opcode');

        // TODO: When we contract A calls contract B, and B throws, instead of an 'invalid jump', we get an 'out of gas'
        // error. How do we distinguish this from an actual out of gas event? The testrpc log actually show an "invalid
        // jump" event).
        var outOfGas = ~err.message.search('out of gas');

        assert(invalidOpcode || outOfGas, `Expected throw, got ${err} instead`);

        return ;
    })

    
};