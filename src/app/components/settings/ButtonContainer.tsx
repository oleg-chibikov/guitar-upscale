import { PianoRollButton } from "@/app/components/pianoRoll/PianoRollButton";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { WithStyle } from "@/app/helpers/withStyle";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import React, { ReactNode } from "react";
import { AboutButton } from "./buttons/AboutButton";
import { FullscreenButton } from "./buttons/FullscreenButton";
import { OpenSettingsButton } from "./buttons/OpenSettingsButton";
import { OpenStrummingSettingsButton } from "./buttons/OpenStrummingSettingsButton";

const DisabledDetectChordButton = dynamic(
  async () =>
    (
      await import(
        "@/app/components/settings/buttons/DisabledDetectChordButton"
      )
    ).DisabledDetectChordButton
);

const DisabledSongUploadButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledSongUploadButton"))
      .DisabledSongUploadButton
);

const DisabledDetectScaleButton = dynamic(
  async () =>
    (
      await import(
        "@/app/components/settings/buttons/DisabledDetectScaleButton"
      )
    ).DisabledDetectScaleButton
);

export const ButtonContainer: React.FC<WithPremiumComponents & WithStyle> = ({
  style,
  premiumComponents,
}) => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  return (
    <section className="flex flex-col gap-1" style={style}>
      <div
        className={`flex flex-row gap-1 ${
          chordsDisplayMode === ChordsDisplayMode.Left
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <OpenSettingsButton />
        {!isMobileDeviceValue && <FullscreenButton />}
        {(premiumComponents.get("chordDetection") as ReactNode) ?? (
          <DisabledDetectChordButton />
        )}
        {(premiumComponents.get("midiUpload") as ReactNode) ?? (
          <DisabledSongUploadButton />
        )}
      </div>
      <div
        className={`flex flex-row gap-1 ${
          chordsDisplayMode === ChordsDisplayMode.Left
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <PianoRollButton />
        <OpenStrummingSettingsButton />
        {(premiumComponents.get("scaleDetection") as ReactNode) ?? (
          <DisabledDetectScaleButton />
        )}
        <AboutButton />
      </div>
    </section>
  );
};
