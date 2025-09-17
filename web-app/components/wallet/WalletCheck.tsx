"use client";

import { useAccount } from "wagmi";

export default function WalletCheck({
  expectedWallet,
  children,
}: {
  expectedWallet: string;
  children: React.ReactNode;
}) {
  const { address, isConnected } = useAccount();

  if (!isConnected) return <div>Please connect your wallet.</div>;

  if (address?.toLowerCase() !== expectedWallet.toLowerCase()) {
    return (
      <div className="mt-4" style={{ color: "red" }}>
        Connected wallet does not match your registered wallet.
        <br />
        Please switch to: <strong>{expectedWallet}</strong>
      </div>
    );
  }

  return <>{children}</>;
}
