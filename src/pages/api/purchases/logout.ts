import { apiHandler } from "@/lib/apiHelper";
import { googlePlaySession } from "@/lib/googlePlaySession";
import type { NextApiRequest, NextApiResponse } from "next";

export const deleteSession = async (req: NextApiRequest) => {
  await googlePlaySession(req).destroy();
  console.log("Subscription cookie cleared");
};

const handle = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await deleteSession(req);
    res.status(200);
  } finally {
    res.end(); // End the response
  }
};

export default apiHandler({
  POST: handle,
});
