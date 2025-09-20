"use client";

import { useState, useEffect } from "react";
import { Countdown } from "../subscription/Countdown";

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
  user_id,
  subscriptions = [],
}: {
  devices: Device[];
  user_id: string;
  subscriptions?: Subscription[];
}) {
  if (!devices || devices.length === 0) {
    return <p>No devices found.</p>;
  }

  function getActiveSubscription(deviceId: string) {
    const now = new Date();
    return subscriptions.find(
      (sub) =>
        sub.device_id === deviceId &&
        sub.user_id === user_id &&
        new Date(sub.start_time) <= now &&
        new Date(sub.end_time) >= now &&
        sub.status === 0
    );
  }

  async function handleSubscribe(
    deviceId: string,
    fee: string,
    duration: number
  ) {
    try {
      const res = await fetch("/api/subscription/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          device_id: deviceId,
          feePerDay: fee,
          duration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Subscribe API error:", data);
        alert(data.error || "Failed to subscribe");
        return;
      }

      console.log("Subscription created:", data.subscription);
      alert("Subscription successful!");
      window.location.reload();
      
    } catch (err) {
      console.error("Fetch failed:", err);
      alert("Subscription failed. Check console for details.");
    }
  }

  console.log("Subscriptions for user:", subscriptions);
  console.log(
    "Checking device:",
    devices.map((d) => d.device_id)
  );

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
                  <Countdown endTime={activeSub.end_time} />
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
                    onClick={() =>
                      handleSubscribe(device.device_id, device.fee, 0)
                    }
                    className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
                  >
                    1 Day
                  </button>
                  <button
                    onClick={() =>
                      handleSubscribe(device.device_id, device.fee, 1)
                    }
                    className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
                  >
                    1 Week
                  </button>
                  <button
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
    </div>
  );
}
