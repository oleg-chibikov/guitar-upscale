import "server-only";

import { PremiumFeatureKeys, PremiumFeatures } from "@/lib/subscription";
import dynamic from "next/dynamic";
import {
  PremiumComponent,
  WithPremiumFeatures,
} from "../helpers/WithPremiumFeatures";
import { Initializer } from "./Initializer";
import { AnimatedAlertWrapper } from "./alert/AnimatedAlertWrapper";
import AuthPanel from "./auth/AuthPanel";
import { ChordsViewWrapper } from "./chords/ChordsViewWrapper";
import { Fretboard } from "./fret/Fretboard";
import { AspectRatioControl } from "./settings/AspectRatioControl";
import { ControlPanel } from "./settings/ControlPanel";
import { SettingsViewWrapper } from "./settings/SettingsViewWrapper";

// TODO
// Chord finder!
// Reverb toggle
// Better animation on play
// More chords
// more instruments + dropdown
// Patreon subscriptions
// Ads
// more examples
// 7,8 string guitars
// get the formula to avoid hardcoding each string height offset
// youtube videos for each scale

const RecordButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/RecordButton"))
      .RecordButton
);
const SkinSelector = dynamic(
  async () =>
    (await import("@/app/components/settings/selectors/SkinSelector"))
      .SkinSelector
);
const PlaybackTypeSelector = dynamic(
  async () =>
    (await import("@/app/components/settings/selectors/PlaybackTypeSelector"))
      .PlaybackTypeSelector
);
const PremiumPlayButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/PremiumPlayButton"))
      .PremiumPlayButton
);

export const premiumFeaturesToMap = (
  features: PremiumFeatures
): Map<PremiumFeatureKeys, PremiumComponent> => {
  const premiumComponents = new Map<PremiumFeatureKeys, PremiumComponent>();
  const convertKeyToComponent = (key: string) => {
    switch (key) {
      case "midiRecorder":
        return <RecordButton />;
      case "skinSelection":
        return <SkinSelector />;
      case "advancedChords":
        return <PlaybackTypeSelector />;
      case "melodies":
        return <PremiumPlayButton />;
      default:
        return null; // Return null for keys without a mapping
    }
  };

  // Iterate over each key-value pair in PremiumFeatures
  Object.entries(features).forEach(async ([key, value]) => {
    // If the value is true, add the corresponding React node to the map
    if (value === true) {
      // You can define the React node here based on the key
      // For simplicity, let's assume it's a string representation of the key
      premiumComponents.set(
        key as PremiumFeatureKeys,
        convertKeyToComponent(key)
      );
    }
  });

  return premiumComponents;
};

export const Main: React.FC<WithPremiumFeatures> = ({ premiumFeatures }) => {
  const premiumComponents = premiumFeaturesToMap(premiumFeatures);
  return (
    <main>
      <Initializer />
      <AnimatedAlertWrapper />
      <ControlPanel premiumComponents={premiumComponents} />
      <Fretboard />
      <SettingsViewWrapper premiumComponents={premiumComponents} />
      <ChordsViewWrapper />
      <AspectRatioControl />
      <AuthPanel />
    </main>
  );
};
