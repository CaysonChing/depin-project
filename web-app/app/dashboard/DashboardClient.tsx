"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function DashboardClient({ walletAddress, children }: { walletAddress: string; children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handleConnect = async () => {
    setError("");
    try {
      disconnect(); // reset any previous connection
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
      await connect({ connector: connectors[0] }); // MetaMask
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to connect wallet");
    }
  };

  const isWalletValid = isConnected && address?.toLowerCase() === walletAddress.toLowerCase();

  // If wallet is invalid, only show warning + connect button
  if (!isWalletValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <p className="text-red-600 text-center">
          ❌ Wrong wallet connected. Please switch to {walletAddress}
        </p>
        {!isConnected && (
          <button
            onClick={handleConnect}
            className="rounded-md bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    );
  }

  // Wallet is valid → show dashboard content
  return <>{children}</>;
}
