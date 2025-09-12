/**
 * This class is to get current user cookie use database without being restricted by the policy
 */

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function getSupabaseServerClient() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("sb-access-token")?.value;

  if (!token) throw new Error("No token found");

  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  return supabaseServer;
}
