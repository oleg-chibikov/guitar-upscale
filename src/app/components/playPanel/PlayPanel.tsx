import { DownloadButton } from "@/app/components/playPanel/DownloadButton";
import { MetronomeButton } from "@/app/components/playPanel/MetronomeButton";
import { NextEventButton } from "@/app/components/playPanel/NextEventButton";
import { PauseButton } from "@/app/components/playPanel/PauseButton";
import { PlayButton } from "@/app/components/playPanel/PlayButton";
import { PreviousEventButton } from "@/app/components/playPanel/PreviousEventButton";
import { AutoQuantizeButton } from "@/app/components/quantize/AutoQuantizeButton";
import { TempoControl } from "@/app/components/settings/valueDialogControls/TempoControl";
import { VolumeControl } from "@/app/components/settings/valueDialogControls/VolumeControl";
import { Panel } from "@/app/components/uiFramework/Panel";
import { PLAY_PANEL_ID } from "@/app/data/elementIds";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { WithStyle } from "@/app/helpers/withStyle";
import { useUiSelector } from "@/app/hooks/storeHooks";
import dynamic from "next/dynamic";
import React, { ReactNode } from "react";

const DisabledRecordButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledRecordButton"))
      .DisabledRecordButton,
);

export const PlayPanel: React.FC<WithPremiumComponents & WithStyle> = ({
  premiumComponents,
}) => {
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  return (
    <Panel bare id={PLAY_PANEL_ID}>
      <PreviousEventButton />
      {(premiumComponents.get("melodies") as ReactNode) ?? <PlayButton />}
      <PauseButton />
      <NextEventButton />
      <DownloadButton />
      {/* <ShareMidiButton /> */}
      <MetronomeButton />
      {(premiumComponents.get("midiRecorder") as ReactNode) ?? (
        <DisabledRecordButton />
      )}
      {premiumComponents.has("midiRecorder") && <AutoQuantizeButton />}
      {/* over the piano roll the bar keeps to the transport buttons */}
      {!pianoRollExpanded && (
        <>
          <TempoControl />
          <VolumeControl />
        </>
      )}
    </Panel>
  );
};
