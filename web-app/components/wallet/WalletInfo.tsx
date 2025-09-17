"use client";

import { useAccount } from "wagmi";

export default function WalletInfo(){
    const {address, isConnected } = useAccount();

    if (!isConnected) return null;

    return(
        <div>
            <strong>Connected address:</strong>
            <div>{address}</div>
        </div>
    );
}