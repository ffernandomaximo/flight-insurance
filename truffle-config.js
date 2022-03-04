const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraKey = "ce1b404ad7334078bf3d10382c6966ee";

const mnemonic = ""

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
        network_id: 4,       // rinkeby's id
        gas: 10000000,        // rinkeby has a lower block limit than mainnet
        gasPrice: 10000000000
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  },
  solc: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 1500
      }
    }
  }
};