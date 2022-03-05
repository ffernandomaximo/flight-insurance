# Flight Insurance
Flight delay is a parametric insurance product:
 - In case you book flight and it got delayed you as the insuree/policyholder receives a payout.
 - The full process is automated, there is no middle man interaction.

# Project Specification
SEPARATION OF CONCERNS, OPERATIONAL CONTROL AND “FAIL FAST”
Smart Contract code is separated into multiple contracts:
1) FlightSuretyData.sol for data persistence
2) FlightSuretyApp.sol for app logic and oracles code


SPECIFIC CONTRACT CALLS:
1) Passenger can purchase insurance for flight
2) Trigger contract to request flight status update


AIRLINE CONTRACT INITIALIZATION
1) First airline is registered when contract is deployed.
2) Only existing airline may register a new airline until there are at least four airlines registered.
3) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines.
4) Airline Ante: Airline can be registered, but does not participate in contract until it submits funding of 10 ether.


PASSENGER AIRLINE CHOICE
1) Passengers can choose from a fixed list of flight numbers and departures that are defined in the Dapp client.
2) Passengers have the bility to purchase flight insurance for no more than 1 ether.


PASSENGER REPAYMENT
1) If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid


ORACLES
...


## Install
This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources
* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
