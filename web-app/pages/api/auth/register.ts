import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/app/lib/supabaseClient";
import { supabaseService } from "@/app/lib/supabaseService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { username, password, email, wallet_address } = req.body;
  if (!username || !password || !wallet_address)
    return res.status(400).json({ error: "Username, password, email, and wallet_address are required" });

  // Insert user into Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  // Get user id from Supabase Auth
  const {user} = data;
  if (!user) return res.status(500).json({ error: "Registration failed, no user created"});

  // Insert user into users table
  const { error: insertError } = await supabaseService.from("users").insert([
    {
      id: user.id,
      username,
      email,
      wallet_address,
    },
  ]);

  if (insertError) return res.status(400).json({ error: insertError.message });

  return res.status(200).json({ user: data.user });
}
