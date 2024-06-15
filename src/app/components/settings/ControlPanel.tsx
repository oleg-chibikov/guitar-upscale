import { Expander } from "@/app/components/layout/Expander";
import { Panel } from "@/app/components/layout/Panel";
import { BaseNoteAndTuningSelector } from "@/app/components/settings/selectors/BaseNoteAndTuningSelector";
import { ChordStrummingDelayControl } from "@/app/components/settings/valueModalControls/ChordStrummingDelayControl";
import { MetronomeVolumeControl } from "@/app/components/settings/valueModalControls/MetronomeVolumeControl";
import { TempoControl } from "@/app/components/settings/valueModalControls/TempoControl";
import { VolumeControl } from "@/app/components/settings/valueModalControls/VolumeControl";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi, setControlPanelExpanded } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ButtonContainer } from "./ButtonContainer";
import { ScaleAndGroupSelector } from "./selectors/ScaleAndGroupSelector";

export const ControlPanel: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const dispatch = useDispatch();
  const { chordsDisplayMode, controlPanelExpanded } = useSelector(selectUi);
  const handleExpansion = () => {
    dispatch(setControlPanelExpanded(!controlPanelExpanded));
  };
  return (
    <section
      className={`z-30 fixed top-1 ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      }`}
      style={{
        maxWidth: "80vw",
        maxHeight: "60vh",
      }}
    >
      <Expander
        reverseIcon
        expanded={controlPanelExpanded}
        handleExpansion={handleExpansion}
        id="control-panel"
        title="Control Panel"
      >
        <Panel enableReverse>
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
      </Expander>
    </section>
  );
};
