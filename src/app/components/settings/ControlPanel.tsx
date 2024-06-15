import { Panel } from "@/app/components/layout/Panel";
import { BaseNoteAndTuningSelector } from "@/app/components/settings/selectors/BaseNoteAndTuningSelector";
import { ChordStrummingDelayControl } from "@/app/components/settings/valueModalControls/ChordStrummingDelayControl";
import { MetronomeVolumeControl } from "@/app/components/settings/valueModalControls/MetronomeVolumeControl";
import { TempoControl } from "@/app/components/settings/valueModalControls/TempoControl";
import { VolumeControl } from "@/app/components/settings/valueModalControls/VolumeControl";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { ButtonContainer } from "./ButtonContainer";
import { ScaleAndGroupSelector } from "./selectors/ScaleAndGroupSelector";

export const ControlPanel: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { chordsDisplayMode } = useSelector(selectUi);
  return (
    <Panel
      enableReverse
      className={`z-30 fixed top-1 ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      }`}
      style={{
        maxWidth: "80vw",
        maxHeight: "60vh",
      }}
    >
      <ScaleAndGroupSelector />
      <BaseNoteAndTuningSelector />
      <ButtonContainer premiumComponents={premiumComponents} />
      <div className="flex flex-col gap-1">
        <VolumeControl />
        <MetronomeVolumeControl />
      </div>
      <div className="flex flex-col gap-1">
        <TempoControl />
        <ChordStrummingDelayControl />
      </div>
    </Panel>
  );
};
