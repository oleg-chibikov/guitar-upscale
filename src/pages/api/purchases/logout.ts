/* Logout Flow:
1) When the frontend detects a mismatch: user has permissions but Google Play doesn't list the purchase anymore we need to logout / revoke permissions
2) We clear the subdscription cookie in this API and reload the page - without the cookie SSR won't set the permissions
*/

import { apiHandler } from "@/lib/apiHelper";
import { clearSubscriptionCookie } from "@/lib/subscriptionCookieUtils";
import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const handle = async (req: NextApiRequest, res: NextApiResponse) => {
  await clearSubscriptionCookie(req, res);
  res.status(HttpStatusCode.Ok).json({ message: "Acknowledged" });
};

export default apiHandler({
  POST: handle,
});
