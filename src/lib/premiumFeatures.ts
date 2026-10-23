import { Session } from "next-auth";
import { auth } from "./auth";
import { isAuthEnabled } from "./featureFlags";
import { TierInfo } from "./tier";
import { applyTierToResult, getTierName } from "./tierHelper";

export type PremiumFeaturesWithSession = {
  premiumFeatures: PremiumFeatures;
  explorerPremiumFeatures: PremiumFeatures;
  composerPremiumFeatures: PremiumFeatures;
  session: Session | null;
  subscriptionTier?: TierInfo;
};

export type PremiumFeatures = {
  midiRecorder?: boolean;
  looper?: boolean;
  playbackTypeSelection?: boolean;
  advancedChords?: boolean;
  instruments?: boolean;
  reverbStrength?: boolean;
  skinSelection?: boolean;
  melodies?: boolean;
  chordDetection?: boolean;
  scaleDetection?: boolean;
  midiUpload?: boolean;
  toggleMetronomeWhenRecordingCheckbox?: boolean;
  saveMidiImmediatelyCheckbox?: boolean;
};

export type PremiumFeatureKeys = keyof PremiumFeatures;

export const explorerPremiumFeatures: PremiumFeatures = {
  melodies: true,
  advancedChords: true,
  instruments: true,
  reverbStrength: true,
  playbackTypeSelection: true,
  chordDetection: true,
  scaleDetection: true,
};

export const composerPremiumFeatures: PremiumFeatures = {
  ...explorerPremiumFeatures,
  midiRecorder: true,
  looper: true,
  toggleMetronomeWhenRecordingCheckbox: true,
  saveMidiImmediatelyCheckbox: true,
  skinSelection: true,
  midiUpload: true,
};

export async function getPremiumFeatures(): Promise<PremiumFeaturesWithSession> {
  if (!isAuthEnabled) {
    return {
      session: null,
      premiumFeatures: composerPremiumFeatures,
      explorerPremiumFeatures,
      composerPremiumFeatures,
    };
  }

  // Determine premium status
  const session = await auth();

  const result: PremiumFeaturesWithSession = {
    session,
    premiumFeatures: {},
    explorerPremiumFeatures,
    composerPremiumFeatures,
  };

  const tierInfo = await getTierName(
    session?.user?.email ?? undefined,
    session?.accessToken,
  );

  console.log("Subscription tier", tierInfo);

  return applyTierToResult(result, tierInfo);
}
