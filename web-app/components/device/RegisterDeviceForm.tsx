"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterDeviceForm({ owner_id }: { owner_id: string }) {
  const [device_id, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/device/registerDevice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id,
        owner_id,
        name,
        type,
        description,
        fee
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMsg("Device Registered Successfully");
      router.push("/dashboard");
      
    } else {
      setMsg(data.error);
    }
  };

  return (
    <div className="flex flex-col px-7 pb-12 border">
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-1">
        <form onSubmit={handleSubmit}>
          <div className="sm:col-span-4">
            <label className="block font-medium">Device ID</label>
            <div className="mt-1">
              <div className="flex items-center rounded-md pl-3 outline-1 -outline-offset-1 w-80">
                <input
                  id="device_id"
                  type="text"
                  name="device_id"
                  value={device_id}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Device ID"
                  className="block py-1.5 pr-5 pl-1 text-base placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full mt-4">
            <label className="block font-medium">Device Name</label>
            <div className="mt-1">
              <div className="flex items-center rounded-md pl-3 outline-1 -outline-offset-1 w-80">
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Device Name"
                  className="block py-1.5 pr-5 pl-1 text-base placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full mt-4">
            <label className="block font-medium">Device Type</label>
            <div className="mt-1">
              <div className="flex items-center rounded-md pl-3 outline-1 -outline-offset-1 w-80">
                <input
                  id="type"
                  type="text"
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Device Type"
                  className="block py-1.5 pr-5 pl-1 text-base placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full mt-4">
            <label className="block font-medium">Description</label>
            <div className="mt-1">
              <div className="flex items-center rounded-md pl-3 outline-1 -outline-offset-1 w-80">
                <input
                  id="description"
                  type="text"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="block py-1.5 pr-5 pl-1 text-base placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full mt-4">
            <label className="block font-medium">Fee</label>
            <div className="mt-1">
              <div className="flex items-center rounded-md pl-3 outline-1 -outline-offset-1 w-80">
                <input
                  id="description"
                  type="number"
                  name="fee"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="Fee"
                  className="block py-1.5 pr-5 pl-1 text-base placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-2 rounded-xl mt-2 font-semibold"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
      {msg && <p>{msg}</p>}
    </div>
  );
}
