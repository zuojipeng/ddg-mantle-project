require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

function sanitizePrivateKey(raw) {
  if (!raw) return "";
  const key = raw.trim().startsWith("0x") ? raw.trim().slice(2) : raw.trim();
  return key;
}

const privateKey = sanitizePrivateKey(process.env.PRIVATE_KEY);
const accounts =
  /^[0-9a-fA-F]{64}$/.test(privateKey) ? [`0x${privateKey}`] : [];

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mantleTestnet: {
      url: process.env.MANTLE_RPC_URL || "https://rpc.testnet.mantle.xyz",
      accounts,
      chainId: Number(process.env.CHAIN_ID) || 5003,
      gasPrice: 1000000000
    },
    hardhat: {
      chainId: 1337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};


