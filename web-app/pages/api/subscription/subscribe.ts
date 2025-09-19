import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseService } from "@/app/lib/supabaseService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { user_id, device_id, feePerDay, duration } = req.body;

    if (!user_id || !device_id || feePerDay === undefined || duration === undefined)
      return res.status(400).json({ error: "Missing required input fields" });

    const startTime = new Date();
    let durationDays = 1;

    if (duration === 1) durationDays = 7;
    if (duration === 2) durationDays = 30;

    const endTime = new Date(startTime);

    endTime.setDate(startTime.getDate() + durationDays);

    const totalFee = Number(feePerDay) * durationDays;

    const { data, error: insertError } = await supabaseService
      .from("subscriptions")
      .insert({
        user_id,
        device_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_fee: totalFee,
        duration,
        status: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ error: "Failed to insert subscription" });
    }

    return res
      .status(200)
      .json({ message: "Subscription created", subscription: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
