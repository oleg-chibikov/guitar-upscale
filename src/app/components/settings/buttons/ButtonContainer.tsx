import React, { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../../data/chordsDisplayMode";
import { selectControlPanel } from "../../../store/controlPanelSlice";
import { FullscreenButton } from "./FullscreenButton";
import { OpenChordsButton } from "./OpenChordsButton";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { PlayButton } from "./PlayButton";
import { RecordButton } from "./RecordButton";

interface ButtonContainerProps {
  style?: CSSProperties;
}

export const ButtonContainer: React.FC<ButtonContainerProps> = ({ style }) => {
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
        <PlayButton />
        <RecordButton />
      </div>
    </section>
  );
};
