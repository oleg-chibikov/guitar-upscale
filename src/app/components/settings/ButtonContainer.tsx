import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { isMobileDevice } from "@/app/helpers/deviceHelper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import React, { CSSProperties, ReactNode } from "react";
import { useSelector } from "react-redux";
import { AboutButton } from "./buttons/AboutButton";
import { FullscreenButton } from "./buttons/FullscreenButton";
import { OpenSettingsButton } from "./buttons/OpenSettingsButton";
import { OpenStrummingSettingsButton } from "./buttons/OpenStrummingSettingsButton";

interface ButtonContainerProps extends WithPremiumComponents {
  style?: CSSProperties;
}

const DisabledDetectChordButton = dynamic(
  async () =>
    (
      await import(
        "@/app/components/settings/buttons/DisabledDetectChordButton"
      )
    ).DisabledDetectChordButton
);

const DisabledMidiUploadButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledMidiUploadButton"))
      .DisabledMidiUploadButton
);

const DisabledDetectScaleButton = dynamic(
  async () =>
    (
      await import(
        "@/app/components/settings/buttons/DisabledDetectScaleButton"
      )
    ).DisabledDetectScaleButton
);

export const ButtonContainer: React.FC<ButtonContainerProps> = ({
  style,
  premiumComponents,
}) => {
  const { chordsDisplayMode } = useSelector(selectUi);
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
        {!isMobileDevice() && <FullscreenButton />}
        {(premiumComponents.get("chordDetection") as ReactNode) ?? (
          <DisabledDetectChordButton />
        )}
        {(premiumComponents.get("scaleDetection") as ReactNode) ?? (
          <DisabledDetectScaleButton />
        )}
      </div>
      <div
        className={`flex flex-row gap-1 ${
          chordsDisplayMode === ChordsDisplayMode.Left
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <OpenStrummingSettingsButton />
        <AboutButton />
        {(premiumComponents.get("midiUpload") as ReactNode) ?? (
          <DisabledMidiUploadButton />
        )}
      </div>
    </section>
  );
};
