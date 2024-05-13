import { Session } from "next-auth";
import { auth } from "./auth";
import { Tier } from "./tiers";

const composerWhitelist = new Set<string>(
  process.env.COMPOSER_WHITELIST?.split(",")
);
const explorerWhitelist = new Set<string>(
  process.env.EXPLORER_WHITELIST?.split(",")
);

async function getTierName(
  email: string | null,
  accessToken: string
): Promise<Tier | undefined> {
  // Checking whitelists
  if (email) {
    if (composerWhitelist.has(email)) {
      return "Composer";
    }
    if (explorerWhitelist.has(email)) {
      return "Explorer";
    }
  }

  // TODO: Check google play billing

  // Getting tier name from patreon API

  // tiers by priority asc
  const orderedTargetTierIds = ["22790257", "22790278"];
  let tierName: Tier | undefined;

  try {
    const url = "TODO";
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
  explorerPremiumFeatures: PremiumFeatures;
  composerPremiumFeatures: PremiumFeatures;
  session: Session | null;
  subscriptionTier?: string;
};

export type PremiumFeatures = {
  midiRecorder?: boolean;
  playbackTypeSelection?: boolean;
  advancedChords?: boolean;
  instruments?: boolean;
  reverbStrength?: boolean;
  skinSelection?: boolean;
  melodies?: boolean;
  chordDetection?: boolean;
  toggleMetronomeWhenRecordingCheckbox?: boolean;
};

export type PremiumFeatureKeys = keyof PremiumFeatures;

export async function getPremiumFeatures(): Promise<PremiumFeaturesWithSession> {
  "use server";
  // Determine premium status
  const session = await auth();

  const explorerPremiumFeatures: PremiumFeatures = {
    melodies: true,
    advancedChords: true,
    instruments: true,
    reverbStrength: true,
    playbackTypeSelection: true,
    chordDetection: true,
  };

  const composerPremiumFeatures: PremiumFeatures = {
    ...explorerPremiumFeatures,
    midiRecorder: true,
    toggleMetronomeWhenRecordingCheckbox: true,
    skinSelection: true,
  };

  const result: PremiumFeaturesWithSession = {
    session,
    premiumFeatures: {},
    explorerPremiumFeatures,
    composerPremiumFeatures,
  };

  if (!session?.accessToken) {
    return result;
  }

  const subscriptionTier = await getTierName(
    session.user?.email ?? null,
    session.accessToken
  );
  console.log("Subscription tier", subscriptionTier);

  if (subscriptionTier === "Explorer") {
    return {
      ...result,
      premiumFeatures: explorerPremiumFeatures,
      subscriptionTier,
    };
  }

  if (subscriptionTier === "Composer") {
    return {
      ...result,
      premiumFeatures: composerPremiumFeatures,
      subscriptionTier,
    };
  }
  return result;
}
