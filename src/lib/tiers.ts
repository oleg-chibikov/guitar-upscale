import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import {
  composerPremiumFeatures,
  explorerPremiumFeatures,
} from "./premiumFeatures";
import {
  GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY,
  getDataFromCookieValue,
} from "./purchaseParams";
import { fetchSubscriptionPurchase } from "./purchases";
import { SubscriptionProvider } from "./subscriptionProvider";

export type Tier = "Explorer" | "Composer";
export type TierKey = "guitar_upscale.composer" | "guitar_upscale.explorer";

export const tierMap = new Map<TierKey, Tier>([
  ["guitar_upscale.composer", "Composer"],
  ["guitar_upscale.explorer", "Explorer"],
]);

const composerWhitelist = new Set<string>(
  process.env.COMPOSER_WHITELIST?.split(",")
);

const explorerWhitelist = new Set<string>(
  process.env.EXPLORER_WHITELIST?.split(",")
);

const getDataFromSubscriptionCookie = () => {
  const value = getCookie(GOOGLE_PLAY_SUBSCRIPTION_COOKIE_KEY, { cookies });
  if (!value) {
    console.log("No value in subscription cookie");
    return undefined;
  }
  console.log("Value in subscription cookie", value);
  return getDataFromCookieValue(value);
};

const getGooglePlaySubscriptionTierFromCookie = async () => {
  const subscriptionData = getDataFromSubscriptionCookie();
  if (subscriptionData) {
    const subscription = await fetchSubscriptionPurchase(subscriptionData);
    if (subscription) {
      return tierMap.get(subscriptionData.itemId);
    }
  }
};

const getTierFromPatreonApi = async (accessToken: string) => {
  // Getting tier name from patreon API

  console.log("Getting tier from Patreon api using token", accessToken);

  // tiers by priority asc
  const orderedTargetTierIds = ["22790257", "22790278"];
  let tierName: Tier | undefined;

  try {
    const url =
      "https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields%5Btier%5D=title";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // accessToken is appended to session using a callback defined in auth.ts
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();

    console.log("Patreon API result", responseData);

    const includedTiers = responseData.included?.filter(
      (item: any) =>
        item.type === "tier" && orderedTargetTierIds.includes(item.id)
    );

    includedTiers?.forEach((tier: any) => {
      tierName = tier.attributes.title; // overwrite with higher priority if has several
    });

    return tierName;
  } catch (error) {
    console.error("Error fetching tier names:", error);
    throw error;
  }
};

const getTierFromWhitelist = (email?: string) => {
  if (email) {
    if (composerWhitelist.has(email)) {
      return "Composer";
    }
    if (explorerWhitelist.has(email)) {
      return "Explorer";
    }
  }
};

export async function getTierName(
  email?: string,
  accessToken?: string
): Promise<TierInfo | undefined> {
  // Checking whitelists
  let tier: Tier | undefined;

  tier = getTierFromWhitelist(email);

  if (tier) {
    console.log("Got tier from whitelist", tier);
    return { tier, provider: SubscriptionProvider.Patreon };
  }

  tier = await getGooglePlaySubscriptionTierFromCookie();
  if (tier) {
    console.log("Got tier from subscription cookie", tier);
    return { tier, provider: SubscriptionProvider.GooglePlay };
  }

  if (!accessToken) {
    return undefined;
  }

  tier = await getTierFromPatreonApi(accessToken);

  if (tier) {
    console.log("Got tier from patreon API", tier);
    return { tier, provider: SubscriptionProvider.Patreon };
  }

  return undefined;
}

export const applyTierToResult = (result: any, subscriptionTier?: TierInfo) => {
  if (!subscriptionTier) {
    return result;
  }

  if (subscriptionTier.tier === "Explorer") {
    return {
      ...result,
      premiumFeatures: explorerPremiumFeatures,
      subscriptionTier,
    };
  }

  if (subscriptionTier.tier === "Composer") {
    return {
      ...result,
      premiumFeatures: composerPremiumFeatures,
      subscriptionTier,
    };
  }

  return result;
};

export type TierInfo = {
  tier: Tier;
  provider: SubscriptionProvider;
};
