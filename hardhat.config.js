require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: __dirname + "/.env" });
// require("@nomicfoundation/hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.10",
  paths: {
    artifacts: "./src/artifacts",
  },
  etherscan: {
    apiKey: {
      mode: "BNHWW84E6R32642AWYU3U3SK5AXBFX3RNZ", // Replace with your Etherscan API key for the mode network
    },
    customChains: [
      {
        network: "mode",
        chainId: 919,
        urls: {
          apiURL: "https://sepolia.explorer.mode.network/", // Replace with your mode network node URL
          browserURL: "https://sepolia.mode.network/", // Replace with your mode network browser URL
        },
      },
    ],
  },
  networks: {
    local: {
      url: process.env.API_KEY_URL, //Your RPC URL
      accounts: [process.env.PRIVATE_KEY], //Your private key
    },
    mode: {
      url: "https://sepolia.mode.network/", // Replace with your mode network node URL
      gas: "auto",
      chainId: 919,
      accounts: [process.env.PRIVATE_KEY],
    },
    // Add more networks if needed
  },
};
