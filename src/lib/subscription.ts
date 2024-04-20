"use server";
import "server-only";

import { Session } from "next-auth";
import { auth } from "./auth";

const composerWhitelist = new Set<string>(
  process.env.COMPOSER_WHITELIST?.split(",")
);
const explorerWhitelist = new Set<string>(
  process.env.EXPLORER_WHITELIST?.split(",")
);

// TODO: include email and unblock Sepcial accounts
async function getTierName(
  email: string | null,
  accessToken: string
): Promise<string | undefined> {
  if (email) {
    console.log(email);
    if (composerWhitelist.has(email)) {
      return "Composer";
    }
    if (explorerWhitelist.has(email)) {
      return "Explorer";
    }
  }
  const url =
    "https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields%5Btier%5D=title";

  // tiers by priority asc
  const orderedTargetTierIds = ["22790257", "22790278"];
  let tierName: string | undefined;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // accessToken is appended to session using a callback defined in auth.ts
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    //console.log(responseData);
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
}

export type PremiumFeaturesWithSession = {
  premiumFeatures: PremiumFeatures;
  session: Session | null;
};

export type PremiumFeatures = {
  subscriptionTier?: string;
  midiRecorder?: boolean;
  advancedChords?: boolean;
  skinSelection?: boolean;
  melodies?: boolean;
};

export async function getPremiumFeatures(): Promise<PremiumFeaturesWithSession> {
  "use server";
  // Determine premium status
  const session = await auth();
  if (!session?.accessToken) {
    return { session, premiumFeatures: {} };
  }

  const subscriptionTier = await getTierName(
    session.user?.email ?? null,
    session.accessToken
  );
  console.log("Subscription tier", subscriptionTier);
  // Load premium feature only if user is premium
  if (subscriptionTier === "Explorer") {
    // Dynamically import premium feature

    return {
      session,
      premiumFeatures: {
        melodies: true,
        advancedChords: true,
        subscriptionTier,
      },
    };
  }

  if (subscriptionTier === "Composer") {
    return {
      session,
      premiumFeatures: {
        midiRecorder: true,
        advancedChords: true,
        skinSelection: true,
        melodies: true,
        subscriptionTier,
      },
    };
  }
  return { session, premiumFeatures: {} };
}

// {
//     "data": {
//         "attributes": {},
//         "id": "126151233",
//         "relationships": {
//             "memberships": {
//                 "data": [
//                     {
//                         "id": "f9a3863d-8a76-42cd-a550-65c6072fc4ca",
//                         "type": "member"
//                     }
//                 ]
//             }
//         },
//         "type": "user"
//     },
//     "included": [
//         {
//             "attributes": {},
//             "id": "f9a3863d-8a76-42cd-a550-65c6072fc4ca",
//             "relationships": {
//                 "currently_entitled_tiers": {
//                     "data": [
//                         {
//                             "id": "22790257",
//                             "type": "tier"
//                         }
//                     ]
//                 }
//             },
//             "type": "member"
//         },
//         {
//             "attributes": {
//                 "title": "Explorer"
//             },
//             "id": "22790257",
//             "type": "tier"
//         }
//     ],
//     "links": {
//         "self": "https://www.patreon.com/api/oauth2/v2/user/126151233"
//     }
// }
