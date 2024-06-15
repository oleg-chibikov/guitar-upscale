import { MetronomeButton } from "@/app/components/playPanel/MetronomeButton";
import { NextEventButton } from "@/app/components/playPanel/NextEventButton";
import { PauseButton } from "@/app/components/playPanel/PauseButton";
import { PlayButton } from "@/app/components/playPanel/PlayButton";
import { PreviousEventButton } from "@/app/components/playPanel/PreviousEventButton";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import React, { CSSProperties, ReactNode } from "react";
import { useSelector } from "react-redux";

interface PlayPanelProps extends WithPremiumComponents {
  style?: CSSProperties;
}

const DisabledRecordButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledRecordButton"))
      .DisabledRecordButton
);

export const PlayPanel: React.FC<PlayPanelProps> = ({
  style,
  premiumComponents,
}) => {
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  return (
    <section
      className={`flex flex-row bottom-1 gap-1 overflow-auto overscroll-contain z-30 fixed border-2 ${
        theme === Theme.Light
          ? "bg-panel-light border-border-light"
          : "bg-panel-dark border-border-dark"
      } ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Right ? "right-52" : "left-52"
      }`}
      style={style}
    >
      <PreviousEventButton />
      {(premiumComponents.get("melodies") as ReactNode) ?? <PlayButton />}
      <PauseButton />
      <NextEventButton />
      <MetronomeButton />
      {(premiumComponents.get("midiRecorder") as ReactNode) ?? (
        <DisabledRecordButton />
      )}
    </section>
  );
};
