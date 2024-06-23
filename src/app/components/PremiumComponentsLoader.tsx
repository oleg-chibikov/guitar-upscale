import "server-only";

import { DetectScaleButton } from "@/app/components/settings/buttons/DetectScaleButton";
import { MidiUploadButton } from "@/app/components/settings/buttons/MidiUploadButton";
import { PremiumFeatureKeys, PremiumFeatures } from "@/lib/premiumFeatures";
import dynamic from "next/dynamic";
import {
  PremiumComponent,
  WithPremiumFeatures,
} from "../helpers/withPremiumFeatures";
import { ClientRoot } from "./ClientRoot";
import { LooperPanel } from "./looper/LooperPanel";
import { DetectChordButton } from "./settings/buttons/DetectChordButton";
import { ToggleMetronomeWhenRecordingCheckbox } from "./settings/checkboxes/ToggleMetronomeWhenRecordingCheckbox";

const RecordButton = dynamic(
  async () =>
    (await import("@/app/components/playPanel/RecordButton")).RecordButton
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
    (await import("@/app/components/playPanel/PremiumPlayButton"))
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
    (
      await import(
        "@/app/components/settings/selectors/instrument/InstrumentSelector"
      )
    ).InstrumentSelector
);
const ChordInstrumentSelector = dynamic(
  async () =>
    (
      await import(
        "@/app/components/settings/selectors/instrument/ChordInstrumentSelector"
      )
    ).InstrumentSelector
);
const ReverbStrengthSlider = dynamic(
  async () =>
    (await import("@/app/components/settings/sliders/ReverbStrengthSlider"))
      .ReverbStrengthSlider
);
// const ErudaConsoleControl = dynamic(
//   async () =>
//     (await import("@/app/components/settings/ErudaConsoleControl"))
//       .ErudaConsoleControl
// );

export const premiumFeaturesToMap = (
  features: PremiumFeatures
): Map<PremiumFeatureKeys, PremiumComponent> => {
  const premiumComponents = new Map<PremiumFeatureKeys, PremiumComponent>();
  const convertKeyToComponent = (key: string) => {
    switch (key) {
      case "midiRecorder":
        return <RecordButton />;
      case "looper":
        return <LooperPanel />;
      case "toggleMetronomeWhenRecordingCheckbox":
        return <ToggleMetronomeWhenRecordingCheckbox />;
      case "skinSelection":
        return <SkinSelector />;
      case "chordDetection":
        return <DetectChordButton />;
      case "scaleDetection":
        return <DetectScaleButton />;
      case "midiUpload":
        return <MidiUploadButton />;
      case "playbackTypeSelection":
        return <PlaybackTypeSelector />;
      case "advancedChords":
        return <UseAdvancedChordsCheckbox />;
      case "instruments":
        return (
          <>
            <InstrumentSelector />
            <ChordInstrumentSelector />
          </>
        );
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

export const PremiumComponentsLoader: React.FC<WithPremiumFeatures> = ({
  premiumFeatures,
}) => {
  const premiumComponents = premiumFeaturesToMap(premiumFeatures);

  return (
    <>
      <ClientRoot premiumComponents={premiumComponents} />
      {/* {process.env.ENABLE_ERUDA_CONSOLE === "true" && <ErudaConsoleControl />} */}
    </>
  );
};
