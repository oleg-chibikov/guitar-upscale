import type { NextApiResponse } from "next";

// The GitHub Pages copy has no server, so it calls these routes on Vercel.
const PAGES_ORIGIN = "https://oleg-chibikov.github.io";

export const allowPagesOrigin = (res: NextApiResponse) =>
  res.setHeader("Access-Control-Allow-Origin", PAGES_ORIGIN);
