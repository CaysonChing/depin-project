"use client";

import React from 'react';
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { iotaTestnet } from './lib/chains/iotaTestnet';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

const wagmiConfig = getDefaultConfig({
    appName: "My RainbowKit App",
    projectId,
    chains: [iotaTestnet],
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode}) {
    return(
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}