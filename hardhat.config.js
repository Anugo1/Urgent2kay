require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Load private key from .env file
const PRIVATE_KEY = process.env.PRIVATE_KEY ;
const BASESCAN_API = process.env.BASESCAN_API;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // For local development
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // For testnet deployment
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    base_sepolia: {
      url: "https://sepolia.base.org",
      accounts: [PRIVATE_KEY],
      gasPrice: 1000000000,
    }
  },
  // For contract verification
  etherscan: {
    apiKey: BASESCAN_API
  }
};