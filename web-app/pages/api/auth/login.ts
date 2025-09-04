import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/app/lib/supabaseClient";
import { supabaseService } from "@/app/lib/supabaseService";
import { setCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  // Getting user row from db using Username
  const { data: users, error: userError } = await supabaseService
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (userError || !users?.email)
    return res.status(400).json({ error: "User not found or email missing" });

  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: users.email,
    password,
  });
  if (error) return res.status(400).json({ error: error.message });
  if (!data.session) return res.status(400).json({ error: "No session created" });

  // Store session in Cookie
  setCookie("sb-access-token", data.session.access_token, {
    req,
    res,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 , // 1hour
    path: "/",
  });


  return res.status(200).json({ message: "Login successful", user: data.user, session: data.session });
}
