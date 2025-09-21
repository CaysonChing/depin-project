"use client";

import { Countdown } from "../subscription/Countdown";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import abiJson from "@/app/abi/DeviceSharing.json";
import { useEffect, useState } from "react";

const contractAddress = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  type User = {
    id: string;
    username: string;
    wallet_address: string;
  };

type Device = {
  device_id: string;
  owner_id: string;
  name: string;
  type: string;
  description: string;
  fee: string;
  status: boolean;
};

type Subscription = {
  id: string;
  user_id: string;
  device_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_fee: number;
  status: number; // 0 = active
};

export default function DeviceList({
  devices,
  user,
  subscriptions = [],
}: {
  devices: Device[];
  user: User;
  subscriptions?: Subscription[];
}) {
  const [msg, setMsg] = useState("");

  const { writeContract: writeSubscribe, data: txHashSubscribe } =
    useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHashSubscribe,
  });

  useEffect(() => {
    if (isSuccess) {
      // reload to update subscription info
      window.location.reload();
    }
  }, [isSuccess]);

  if (!devices || devices.length === 0) {
    return <p>No devices found.</p>;
  }

  const handleSubscribe = async (
    deviceId: string,
    fee: string,
    duration: number
  ) => {
    setMsg("");

    let db_success = false;

    try {
      const res = await fetch("/api/subscription/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          device_id: deviceId,
          feePerDay: fee,
          duration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Failed to save subscription to database");
        return;
      }

      db_success = true;
    } catch (err) {
      setMsg("Database request failed");
      return;
    }

    try {
      let durationDays = 1;
      if (duration === 1) durationDays = 7;
      if (duration === 2) durationDays = 30;

      const feePerDay = parseEther(String(fee));
      const totalFee = feePerDay * BigInt(durationDays);

      writeSubscribe({
        address: contractAddress,
        abi: abiJson.abi,
        functionName: "subscribe",
        args: [deviceId, duration],
        value: totalFee,
      });
    } catch (err) {
      if (err instanceof Error) {
        setMsg(err.message);
      } else {
        setMsg(
          db_success
            ? "On-chain write failed. Database saved successfully"
            : "Subscription failed"
        );
      }
    };
  };

    function getActiveSubscription(deviceId: string) {
    const now = new Date();
    return subscriptions.find(
      (sub) =>
        sub.device_id === deviceId &&
        sub.user_id === user.id &&
        new Date(sub.start_time) <= now &&
        new Date(sub.end_time) >= now
    );
  }

  console.log("User id:" , user.id)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
      {devices.map((device) => {
        const activeSub = getActiveSubscription(device.device_id);

        return (
          <div
            key={device.device_id}
            className="border rounded-xl p-6 shadow-sm flex flex-col h-full"
          >
            <h2 className="font-bold text-2xl mb-2">{device.name}</h2>

            <p>
              <span className="font-semibold">Device ID:</span>{" "}
              {device.device_id}
            </p>
            <p>
              <span className="font-semibold">Owner :</span> {device.owner_id}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={device.status ? "text-green-600" : "text-red-600"}
              >
                {device.status ? "Active" : "Inactive"}
              </span>
            </p>
            <p>
              <span className="font-semibold">Fee per day:</span> {device.fee}{" "}
              IOTA-t
            </p>
            <p>
              <span className="font-semibold">Description:</span> <br />{" "}
              {device.description}
            </p>

            {activeSub ? (
              <div className="flex flex-col gap-2 mt-4">
                <p>
                  <span className="font-semibold">Subscription ends in:</span>{" "}
                  <Countdown endTime={activeSub.end_time} subscriptionId={activeSub.id} />
                </p>
                <button className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400">
                  View Device Data
                </button>
              </div>
            ) : (
              <div>
                <p className="font-semibold mt-4">Subscription:</p>
                <div className="mt-2 flex justify-between">
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleSubscribe(device.device_id, device.fee, 0)
                    }
                    className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
                  >
                    1 Day
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleSubscribe(device.device_id, device.fee, 1)
                    }
                    className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
                  >
                    1 Week
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleSubscribe(device.device_id, device.fee, 2)
                    }
                    className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
                  >
                    1 Month
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {msg && (
        <div className="col-span-full text-center text-red-500 mt-4">{msg}</div>
      )}
    </div>
  );
}
