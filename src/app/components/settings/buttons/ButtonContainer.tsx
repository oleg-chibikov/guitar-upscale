import { usePremiumFeatures } from "@/app/context/PremiumFeaturesContext";
import dynamic from "next/dynamic";
import React, { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../../data/chordsDisplayMode";
import { selectControlPanel } from "../../../store/controlPanelSlice";
import { FullscreenButton } from "./FullscreenButton";
import { MetronomeButton } from "./MetronomeButton";
import { OpenChordsButton } from "./OpenChordsButton";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { PlayButton } from "./PlayButton";

interface ButtonContainerProps {
  style?: CSSProperties;
}

const RecordButton = dynamic(
  () => import("./RecordButton").then((module) => module.RecordButton),
  {}
);

export const ButtonContainer: React.FC<ButtonContainerProps> = ({ style }) => {
  const { chordsDisplayMode } = useSelector(selectControlPanel);
  const premiumFeatures = usePremiumFeatures();
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
        <PlayButton />
        <MetronomeButton />
        {premiumFeatures?.midiRecorder && <RecordButton />}
      </div>
    </section>
  );
};
