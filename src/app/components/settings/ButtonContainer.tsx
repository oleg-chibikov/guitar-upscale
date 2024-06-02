import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
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

const DisabledRecordButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledRecordButton"))
      .DisabledRecordButton
);

const DisabledDetectChordButton = dynamic(
  async () =>
    (
      await import(
        "@/app/components/settings/buttons/DisabledDetectChordButton"
      )
    ).DisabledDetectChordButton
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
        <FullscreenButton />
        {(premiumComponents.get("chordDetection") as ReactNode) ?? (
          <DisabledDetectChordButton />
        )}
        <MidiUploadButton />
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
      </div>
    </section>
  );
};
