import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  res.setHeader(
    "Set-Cookie",
    `sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );

  // Redirect to login
  res.writeHead(302, { Location: "/auth/login" });
  res.end();
}
