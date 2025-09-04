"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMsg("Login Successful");

      //Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } else {
      setMsg(data.error || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-2xl/9 font-bold tracking-tight">
          Login
        </h1>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-100 p-8 rounded-2xl shadow-xl ">
        <form onSubmit={handleLogin} className="space-y-5">
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

            <input
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full rounded-md bg-white/20 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray focus:outline-2 focus:outline-offset-2 sm:text-sm/6"
            />
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm/6 font-semibold hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 text-white"
            >
              Login
            </button>
          </div>
          <div className="text-center font-normal">
            <p>Don&apos;t have an account? <a href="/auth/register" className="font-semibold" >Register now</a> </p>
          </div>
        </form>
      </div>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
