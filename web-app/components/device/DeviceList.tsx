"use client";

type Device = {
  device_id: string;
  owner_id: string;
  name: string;
  type: string;
  description: string;
  fee: string;
  status: boolean;
};


export default function DeviceList({
  devices,
  user_id,
}: {
  devices: Device[];
  user_id: string;
}) {
  if (!devices || devices.length === 0) {
    return <p>No devices found.</p>;
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
          duration
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
    } catch (err) {
      console.error("Fetch failed:", err);
      alert("Subscription failed. Check console for details.");
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
      {devices.map((device) => (
        <div
          key={device.device_id}
          className="border rounded-xl p-6 shadow-sm flex flex-col h-full"
        >
          <h2 className="font-bold text-2xl mb-2">{device.name}</h2>

          <div className="space-y-2">
            <p>
              <span className="font-semibold">Device ID:</span>{" "}
              {device.device_id}
            </p>

            <p>
              <span className="font-semibold">Owner :</span> {device.owner_id}
            </p>

            <p className="font-semibold">
              Status:{" "}
              <span
                className={`font-semibold ${
                  device.status ? "text-green-600" : "text-red-600"
                }`}
              >
                {device.status ? "Active" : "Inactive"}
              </span>
            </p>

            <p>
              <span className="font-semibold">Fee per day :</span> {device.fee}{" "}
              IOTA-t
            </p>

            <p>
              <span className="font-semibold">Description:</span> <br />
              {device.description}
            </p>

            <div className="mt-3">
              <p className="font-semibold">Subscribe:</p>
            </div>

            <div className="mt-auto pt-1 flex justify-between">
              <button
                onClick={() => handleSubscribe(device.device_id, device.fee, 0)} // 0 = DAY
                className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
              >
                1 Day
              </button>
              <button
                onClick={() => handleSubscribe(device.device_id, device.fee, 1)} // 1 = WEEK
                className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
              >
                1 Week
              </button>
              <button
                onClick={() => handleSubscribe(device.device_id, device.fee, 2)} // 2 = MONTH
                className="p-2 px-10 border rounded-2xl hover:shadow-2xl hover:border-2 hover:bg-gray-400"
              >
                1 Month
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
