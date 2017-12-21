# CLN Contracts

Smart contracts for [Colu Local Network].

![Colu Local Network](cln.png)

CLN is a cryptocurrency built on top of the [Ethereum][ethereum] blockchain.

It is envisioned as a decentralized payment system powered by everyday consumption.

## Contracts

Please see the [contracts/](contracts) directory.

## Develop

Contracts are written in [Solidity][solidity] and tested using [Truffle][truffle] and [testrpc][testrpc].

### Depenencies

```bash
# Install Truffle and testrpc packages globally:
$ npm install -g truffle ethereumjs-testrpc

# Install local node dependencies:
$ npm install
```

### Test

```bash
# This will initialize a testrpc instance, compile and test the contracts using truffle
$ npm test

# Enable long tests
$ LONG_TESTS=1 truffle test
```


[Colu Local Network]: https://cln.colu.com
[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
[testrpc]: https://github.com/ethereumjs/testrpc

[docker compose]: https://docs.docker.com/compose/