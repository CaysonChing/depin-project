import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

// Used to laod environment variables from the .env file
import "dotenv/config";

// const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
// const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const IOTA_EVM_TESTNET_RPC_URL = process.env.IOTA_EVM_TESTNET_RPC_URL || "";

const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // 👈 Add this to fix stack-too-deep
    },
  },
  networks: {
    iotaTestnet: {
      url: IOTA_EVM_TESTNET_RPC_URL,
      chainId: 1076,
      accounts: WALLET_PRIVATE_KEY ? [WALLET_PRIVATE_KEY] : [],
      confirmations: 1,
    } as any,
    // amoy: {
    //   url: AMOY_RPC_URL,
    //   accounts: WALLET_PRIVATE_KEY ? [WALLET_PRIVATE_KEY] : [],
    //   gasPrice: 25000000000, // 25 gwei
    // },
  },
  etherscan: {
    apiKey: {
      iotaTestnet: "empty",
    },

    customChains: [
      {
        network: "iotaTestnet",
        chainId: 1076,
        urls: {
          apiURL: "https://explorer.evm.testnet.iota.cafe/api",
          browserURL: "https://explorer.evm.testnet.iota.cafe"
        }
      }
    ]
  },
};

export default config;
