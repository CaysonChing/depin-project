"use client";

type Device = {
  device_id: string;
  name: string;
  type: string;
  description: string;
  status: boolean;
};

export default function DeviceList({ devices }: { devices: Device[] }) {
  if (!devices || devices.length === 0) {
    return <p>No devices found.</p>;
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

            <p
              className={`font-semibold ${
                device.status ? "text-green-600" : "text-red-600"
              }`}
            >
              <span className="font-semibold text-black">Status:</span>{" "}
              {device.status ? "Active" : "Inactive"}
            </p>

            <p>
              <span className="font-semibold">Description:</span> <br />
              {device.description}
            </p>

            <div className="mt-auto pt-4">
              <button className="p-1 border rounded-2xl w-full hover:shadow-2xl hover:border-2">
                Use
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
