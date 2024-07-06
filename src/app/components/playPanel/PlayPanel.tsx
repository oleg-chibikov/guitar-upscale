import { PianoRollIconButton } from "@/app/components/pianoRoll/PianoRollButton";
import { MetronomeButton } from "@/app/components/playPanel/MetronomeButton";
import { NextEventButton } from "@/app/components/playPanel/NextEventButton";
import { PauseButton } from "@/app/components/playPanel/PauseButton";
import { PlayButton } from "@/app/components/playPanel/PlayButton";
import { PreviousEventButton } from "@/app/components/playPanel/PreviousEventButton";
import { Panel } from "@/app/components/uiFramework/Panel";
import { PLAY_PANEL_ID } from "@/app/data/elementIds";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { WithStyle } from "@/app/helpers/withStyle";
import dynamic from "next/dynamic";
import React, { ReactNode } from "react";

const DisabledRecordButton = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/DisabledRecordButton"))
      .DisabledRecordButton
);

export const PlayPanel: React.FC<WithPremiumComponents & WithStyle> = ({
  premiumComponents,
}) => {
  return (
    <Panel id={PLAY_PANEL_ID}>
      <PreviousEventButton />
      {(premiumComponents.get("melodies") as ReactNode) ?? <PlayButton />}
      <PauseButton />
      <NextEventButton />
      <MetronomeButton />
      {(premiumComponents.get("midiRecorder") as ReactNode) ?? (
        <DisabledRecordButton />
      )}
      <PianoRollIconButton />
    </Panel>
  );
};
