import nextAppSession from "next-app-session";
import { PurchaseParams } from "./purchaseParams";

// Setup the config for your session and cookie
export const googlePlaySession = nextAppSession<PurchaseParams>({});
