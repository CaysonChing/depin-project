"use client";

import { useAccount } from "wagmi";

export default function WalletInfo(){
    const {address, isConnected } = useAccount();

    if (!isConnected) return null;

    return(
        <div className="mt-4">
            <strong>Connected address:</strong>
            <div>{address}</div>
        </div>
    );
}