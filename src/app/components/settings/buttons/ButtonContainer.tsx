import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import dynamic from "next/dynamic";
import React, { CSSProperties, ReactNode } from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../../data/chordsDisplayMode";
import { selectControlPanel } from "../../../store/controlPanelSlice";
import { FullscreenButton } from "./FullscreenButton";
import { MetronomeButton } from "./MetronomeButton";
import { OpenChordsButton } from "./OpenChordsButton";
import { OpenSettingsButton } from "./OpenSettingsButton";
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
  const { chordsDisplayMode } = useSelector(selectControlPanel);
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
        <OpenChordsButton />
        <FullscreenButton />
      </div>
      <div
        className={`flex flex-row gap-1 ${
          chordsDisplayMode === ChordsDisplayMode.Left
            ? "justify-end"
            : "justify-start"
        }`}
      >
        {(premiumComponents.get("melodies") as ReactNode) ?? <PlayButton />}
        <MetronomeButton />
        {(premiumComponents.get("midiRecorder") as ReactNode) ?? (
          <DisabledRecordButton />
        )}
      </div>
    </section>
  );
};
