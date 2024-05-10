import { Session } from "next-auth";
import { auth } from "./auth";

const composerWhitelist = new Set<string>(
  process.env.COMPOSER_WHITELIST?.split(",")
);
const explorerWhitelist = new Set<string>(
  process.env.EXPLORER_WHITELIST?.split(",")
);

async function getTierName(
  email: string | null,
  accessToken: string
): Promise<string | undefined> {
  if (email) {
    if (composerWhitelist.has(email)) {
      return "Composer";
    }
    if (explorerWhitelist.has(email)) {
      return "Explorer";
    }
  }

  // tiers by priority asc
  const orderedTargetTierIds = ["22790257", "22790278"];
  let tierName: string | undefined;

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
  session: Session | null;
};

export type PremiumFeatures = {
  subscriptionTier?: string;
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
  if (!session?.accessToken) {
    return { session, premiumFeatures: {} };
  }

  const subscriptionTier = await getTierName(
    session.user?.email ?? null,
    session.accessToken
  );
  console.log("Subscription tier", subscriptionTier);
  // Load premium feature only if user is premium
  const settings = {
    session,
    premiumFeatures: {
      melodies: true,
      advancedChords: true,
      instruments: true,
      reverbStrength: true,
      playbackTypeSelection: true,
      chordDetection: true,
      subscriptionTier,
    } as PremiumFeatures,
  };
  if (subscriptionTier === "Explorer") {
    // Dynamically import premium feature

    return settings;
  }

  if (subscriptionTier === "Composer") {
    return {
      ...settings,
      premiumFeatures: {
        ...settings.premiumFeatures,
        midiRecorder: true,
        toggleMetronomeWhenRecordingCheckbox: true,
        skinSelection: true,
      },
    };
  }
  return { session, premiumFeatures: {} };
}
