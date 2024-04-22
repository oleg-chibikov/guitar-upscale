import "server-only";

import { PremiumFeatureKeys, PremiumFeatures } from "@/lib/subscription";
import dynamic from "next/dynamic";
import {
  PremiumComponent,
  WithPremiumFeatures,
} from "../helpers/WithPremiumFeatures";
import { Initializer } from "./Initializer";
import { AlertWrapper } from "./alert/AlertWrapper";
import AuthPanel from "./auth/AuthPanel";
import { ChordsView } from "./chords/ChordsView";
import { Fretboard } from "./fret/Fretboard";
import { AspectRatioControl } from "./settings/AspectRatioControl";
import { ControlPanel } from "./settings/ControlPanel";
import { SettingsViewWrapper } from "./settings/SettingsViewWrapper";

// TODO
// Chord finder!
// Reverb toggle
// Better animation on play
// More chords
// Ads
// more examples
// 7,8 string guitars
// Feedback form
// get the formula to avoid hardcoding each string height offset
// youtube videos for each scale
// High string bottom mode
// make sure https://guitar-upscale.org.uk/api/auth/signin?error=OAuthCallback doesn't report Dangerous

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
const UseAdvancedChordsCheckbox = dynamic(
  async () =>
    (
      await import(
        "@/app/components/settings/checkboxes/UseAdvancedChordsCheckbox"
      )
    ).UseAdvancedChordsCheckbox
);
const InstrumentSelector = dynamic(
  async () =>
    (await import("@/app/components/settings/selectors/InstrumentSelector"))
      .InstrumentSelector
);
const ReverbStrengthSlider = dynamic(
  async () =>
    (await import("@/app/components/settings/sliders/ReverbStrengthSlider"))
      .ReverbStrengthSlider
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
      case "playbackTypeSelection":
        return <PlaybackTypeSelector />;
      case "advancedChords":
        return <UseAdvancedChordsCheckbox />;
      case "instruments":
        return <InstrumentSelector />;
      case "reverbStrength":
        return <ReverbStrengthSlider />;
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
      <AlertWrapper />
      <ControlPanel premiumComponents={premiumComponents} />
      <Fretboard />
      <SettingsViewWrapper premiumComponents={premiumComponents} />
      <ChordsView />
      <AspectRatioControl />
      <AuthPanel />
    </main>
  );
};
