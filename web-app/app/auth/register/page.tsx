"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        email,
        wallet_address: wallet,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMsg("Registration successful.");

      //Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } else {
      setMsg(data.error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-2xl/9 font-bold tracking-tight">
          Register an account
        </h1>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-100 p-8 rounded-2xl shadow-xl ">
        <form onSubmit={handleRegister} className="space-y-5">
          
          <div>
            <label htmlFor="username" className="block text-sm/6 font-medium">
              Username
            </label>

            <div className="mt-2 px-0.5">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="block w-full rounded-md bg-white/20 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray focus:outline-2 focus:outline-offset-2 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm/6 font-medium">
              Password
            </label>

            <div className="mt-2 px-0.5">
              <input
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="block w-full rounded-md bg-white/20 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray focus:outline-2 focus:outline-offset-2 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium">
              Email
            </label>

            <div className="mt-2 px-0.5">
              <input
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="block w-full rounded-md bg-white/20 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray focus:outline-2 focus:outline-offset-2 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wallet_address" className="block text-sm/6 font-medium">
              Wallet Address
            </label>

            <div className="mt-2 px-0.5">
              <input
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="Wallet Address"
                className="block w-full rounded-md bg-white/20 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray focus:outline-2 focus:outline-offset-2 sm:text-sm/6"
              />
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="flex w-full justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm/6 font-semibold hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 text-white">Register</button>
          </div>
        </form>
      </div>
      {msg && <p>{msg}</p>}
    </div>
  );
}
