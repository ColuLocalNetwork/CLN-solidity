# CLN Contracts

Smart contracts for [Colu Local Network].

![Colu Local Network](cln.png)

CLN is a cryptocurrency built on top of the [Ethereum][ethereum] blockchain.

It is envisioned as a decentralized payment system powered by everyday consumption.

## Contracts

Please see the [contracts/](contracts) directory.

## Develop

Contracts are written in [Solidity][solidity] and tested using [Truffle][truffle] and [ganache-cli][ganache-cli].

### Depenencies

```bash
# Install Truffle and ganache-cli packages globally:
$ npm install -g truffle ganache-cli

# Install local node dependencies:
$ npm install
```

### Test

```bash
# This will initialize a ganache-cli instance, compile and test the contracts using truffle
$ npm test

# Enable long tests
$ LONG_TESTS=1 truffle test
```

## License
Code released under the [MIT License](https://github.com/colucom/CLN-solidity/blob/master/LICENSE).

[Colu Local Network]: https://cln.colu.com
[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
[ganache-cli]: https://github.com/trufflesuite/ganache-cli

[docker compose]: https://docs.docker.com/compose/