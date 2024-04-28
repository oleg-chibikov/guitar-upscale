import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import React, { CSSProperties, ReactNode } from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../../data/chordsDisplayMode";
import { FullscreenButton } from "./FullscreenButton";
import { MetronomeButton } from "./MetronomeButton";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { OpenStrummingSettingsButton } from "./OpenStrummingSettingsButton";
import { PlayButton } from "./PlayButton";

interface ButtonContainerProps extends WithPremiumComponents {
  style?: CSSProperties;
}
const DisabledRecordButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledRecordButton"))
      .DisabledRecordButton
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
        {premiumComponents.get("chordDetection") as ReactNode}
        {(premiumComponents.get("melodies") as ReactNode) ?? <PlayButton />}
      </div>
      <div
        className={`flex flex-row gap-1 ${
          chordsDisplayMode === ChordsDisplayMode.Left
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <MetronomeButton />
        {(premiumComponents.get("midiRecorder") as ReactNode) ?? (
          <DisabledRecordButton />
        )}
        <OpenStrummingSettingsButton />
      </div>
    </section>
  );
};
