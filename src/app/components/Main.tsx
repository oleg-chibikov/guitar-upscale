import { AnimatedAlert } from "./AnimatedAlert";
import { Initializer } from "./Initializer";
import AuthPanel from "./auth/AuthPanel";
import { ChordsView } from "./chords/ChordsView";
import { Fretboard } from "./fret/Fretboard";
import { AspectRatioControl } from "./settings/AspectRatioControl";
import { ControlPanel } from "./settings/ControlPanel";
import { SettingsView } from "./settings/SettingsView";

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

export const Main: React.FC = () => {
  return (
    <main>
      <Initializer />
      <AnimatedAlert />
      <ControlPanel />
      <Fretboard />
      <SettingsView />
      <ChordsView />
      <AspectRatioControl />
      <AuthPanel />
    </main>
  );
};
