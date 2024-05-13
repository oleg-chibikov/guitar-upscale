import { apiHandler } from "@/lib/apiHelper";
import { GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY } from "@/lib/purchaseParams";
import { deleteCookie } from "cookies-next";
import type { NextApiRequest, NextApiResponse } from "next";

const handle = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    deleteCookie(GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY, {
      req,
      res,
    });
    console.log("Subscription cookie cleared");

    res.status(200);
  } finally {
    res.end(); // End the response
  }
};

export default apiHandler({
  POST: handle,
});
