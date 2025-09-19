import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseService } from "@/app/lib/supabaseService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { device_id, owner_id, name, type, description, fee } = req.body;

  if (!device_id || !owner_id || !name || !type || !description || !fee)
    return res.status(400).json({ error: "Missing required input fields" });

  const { error: insertError } = await supabaseService.from("devices").insert([
    {
      device_id,
      owner_id,
      name,
      type,
      description,
      fee: Number(fee),
    },
  ]);

  if (insertError) return res.status(400).json({ error: insertError.message });

  return res.status(200).json({ success: true});
}
