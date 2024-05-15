import { ResponseData, apiHandler } from "@/lib/apiHelper";
import { GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY } from "@/lib/purchaseParams";
import { HttpStatusCode } from "axios";
import { deleteCookie } from "cookies-next";
import type { NextApiRequest, NextApiResponse } from "next";

export const clearSubscriptionCookie = (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  deleteCookie(GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY, {
    req,
    res,
  });
  console.log("Subscription cookie cleared");
};

const handle = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    clearSubscriptionCookie(req, res);
    res.status(HttpStatusCode.Ok).json({ message: "Acknowledged" });
  } finally {
    res.end(); // End the response
  }
};

export default apiHandler({
  POST: handle,
});
