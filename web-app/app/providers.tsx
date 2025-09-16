"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { iotaTestnet } from "@/app/lib/chains/iotaTestnet";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// React Query client
const queryClient = new QueryClient();

const chains = [iotaTestnet] as const;

const { wallets } = getDefaultWallets();

const connectors = connectorsForWallets(wallets, {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  appName: "My IOTA Testnet DApp",
});

const config = createConfig({
  chains,
  connectors,
  transports: {
    [iotaTestnet.id]: http(process.env.NEXT_PUBLIC_IOTA_TESTNET_RPC_URL!),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
