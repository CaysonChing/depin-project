import { defineChain } from "viem"

const RPC_URL = process.env.NEXT_PUBLIC_IOTA_TESTNET_RPC_URL!;
const EXPLORER_URL = process.env.NEXT_PUBLIC_IOTA_EXPLORER_URL!;

export const iotaTestnet = defineChain({
    id: 1076,
    name: "IOTA 2.0 Testnet",
    nativeCurrency: {
        name: "IOTA",
        symbol: "IOTA-t",
        decimals: 18,
    },
    rpcUrls:{
        default:{
            http: [RPC_URL],
        },
        public:{
            http: [RPC_URL],
        },
    },
    blockExplorers: {
        default: {
            name: "IOTA Explorer",
            url: EXPLORER_URL,
        },
    },

    testnet: true,
})