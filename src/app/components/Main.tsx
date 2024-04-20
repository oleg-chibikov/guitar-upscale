import "server-only";

import dynamic from "next/dynamic";
import { WithPremiumFeatures } from "../helpers/WithPremiumFeatures";
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
  async () => (await import("./settings/buttons/RecordButton")).RecordButton
);

export const Main: React.FC<WithPremiumFeatures> = ({ premiumFeatures }) => {
  return (
    <main>
      <Initializer />
      <AnimatedAlertWrapper />
      <ControlPanel>
        {premiumFeatures.premiumFeatures.midiRecorder && <RecordButton />}
      </ControlPanel>
      <Fretboard />
      <SettingsViewWrapper />
      <ChordsViewWrapper />
      <AspectRatioControl />
      <AuthPanel />
    </main>
  );
};
