import { getAuthConfig } from "@/lib/auth";
import NextAuth from "next-auth";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.nextauth?.includes("error")) {
    res.redirect("/");
    res.end();
  }

  return await NextAuth(req, res, getAuthConfig());
}
