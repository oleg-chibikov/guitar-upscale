import { MetronomeButton } from "@/app/components/playPanel/MetronomeButton";
import { PauseButton } from "@/app/components/playPanel/PauseButton";
import { PlayButton } from "@/app/components/playPanel/PlayButton";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
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
        {(premiumComponents.get("melodies") as ReactNode) ?? <PlayButton />}
        <PauseButton />
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
      </div>
    </section>
  );
};
