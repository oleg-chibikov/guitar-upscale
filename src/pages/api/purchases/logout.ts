/* Logout Flow:
1) When the frontend detects a mismatch: user has permissions but Google Play doesn't list the purchase anymore we need to logout / revoke permissions
2) We clear the subdscription cookie in this API and reload the page - without the cookie SSR won't set the permissions
*/

import { apiHandler } from "@/lib/apiHelper";
import { ResponseData } from "@/lib/apiTypes";
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
