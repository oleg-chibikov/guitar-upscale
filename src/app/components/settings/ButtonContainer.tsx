import { PianoRollButton } from "@/app/components/pianoRoll/PianoRollButton";
import { StrummingPatternButton } from "@/app/components/strumming/StrummingPatternButton";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { WithStyle } from "@/app/helpers/withStyle";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import React from "react";
import { AboutButton } from "./buttons/AboutButton";
import { FullscreenButton } from "./buttons/FullscreenButton";
import { OpenSettingsButton } from "./buttons/OpenSettingsButton";
import { OpenStrummingSettingsButton } from "./buttons/OpenStrummingSettingsButton";
import { ReloadButton } from "./buttons/ReloadButton";

const DisabledDetectChordButton = dynamic(
  async () =>
    (
      await import("@/app/components/settings/buttons/DisabledDetectChordButton")
    ).DisabledDetectChordButton,
);

const DisabledSongUploadButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledSongUploadButton"))
      .DisabledSongUploadButton,
);

export const ButtonContainer: React.FC<WithPremiumComponents & WithStyle> = ({
  style,
  premiumComponents,
}) => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  return (
    <section
      className={`flex flex-row gap-1.5 ${
        chordsDisplayMode === ChordsDisplayMode.Left
          ? "flex-row-reverse"
          : "flex-row"
      }`}
      style={style}
    >
      <OpenSettingsButton />
      <PianoRollButton />
      <OpenStrummingSettingsButton />
      <StrummingPatternButton />
      {premiumComponents.get("chordDetection") ?? <DisabledDetectChordButton />}
      {premiumComponents.get("midiUpload") ?? <DisabledSongUploadButton />}
      {!isMobileDeviceValue && <FullscreenButton />}
      <ReloadButton />
      <AboutButton />
    </section>
  );
};
