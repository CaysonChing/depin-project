"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useBalance,
  useWriteContract,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import abiJson from "@/app/abi/DeviceSharing.json";

const contractAddress = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS! as `0x${string}`;

export default function ContractManager({ isOwner }: { isOwner: boolean }) {
  const [newReward, setNewReward] = useState("");
  const [fundAmount, setFundAmount] = useState("");

  // Read functions
  const { data: reward, refetch: refetchReward } = useReadContract({
    address: contractAddress,
    abi: abiJson.abi,
    functionName: "registrationReward",
  });

  const { data: balance, refetch: refetchBalance } = useBalance({
    address: contractAddress,
  });

  // Write functions
  const { writeContract: writeSetReward, data: txHashSet } = useWriteContract();
  const { isLoading: settingReward, isSuccess: rewardSuccess } =
    useWaitForTransactionReceipt({
      hash: txHashSet,
    });

  const { writeContract: writeFund, data: txHashFund } = useWriteContract();
  const { isLoading: funding, isSuccess: fundingSuccess } =
    useWaitForTransactionReceipt({
      hash: txHashFund,
    });

  useEffect(() => {
    if (rewardSuccess) {
      setNewReward("");
      refetchReward?.();
    }
  }, [rewardSuccess, refetchReward]);

  useEffect(() => {
    if (fundingSuccess) {
      setFundAmount("");
      refetchBalance?.();
    }
  }, [fundingSuccess, refetchBalance]);

  return (
    <div>
      <div className="grid grid-cols-2 mb-5">
        <div className="p-2 px-6 rounded-2xl shadow-2xl font-semibold">
          <p>
            Contract Balance:{" "}
            {balance ? `${balance.formatted} ${balance.symbol}` : "Loading..."}
          </p>
        </div>

        <div className="p-2 px-6 rounded-2xl me-4 shadow-2xl font-semibold">
          <p>
            Current Reward:{" "}
            {typeof reward === "bigint"
              ? `${formatEther(reward)} IOTA-t`
              : "Loading..."}
          </p>
        </div>

      </div>

      {isOwner ? (
        <div className=" border-white p-8 rounded-xl shadow-xl justify-center">
          <label className="">Set new Reward</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={newReward}
              onChange={(e) => setNewReward(e.target.value)}
              placeholder="New Reward"
              className="border rounded p-2 mr-2 mt-2"
            />
            <button
              disabled={settingReward || !newReward}
              onClick={() =>
                writeSetReward({
                  address: contractAddress,
                  abi: abiJson.abi,
                  functionName: "setRegistrationReward",
                  args: [parseEther(newReward)],
                })
              }
              className="bg-blue-600 text-white px-8 py-2 rounded mt-2 font-semibold"
            >
              {settingReward ? "Setting..." : "Set Reward"}
            </button>
          </div>

          <div className="mt-5">
            <label>Fund Contract</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Amount in IOTA"
                className="border rounded p-2 mr-2 mt-2"
              />
              <button
                disabled={funding}
                onClick={() =>
                  writeFund({
                    address: contractAddress,
                    abi: abiJson.abi,
                    functionName: "fundContract",
                    value: parseEther(fundAmount),
                  })
                }
                className="bg-green-600 text-white px-5 py-2 rounded mt-2 font-semibold"
              >
                {funding ? "Funding..." : "Fund Contract"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-red-500">Unauthorzied account</p>
      )}
    </div>
  );
}
