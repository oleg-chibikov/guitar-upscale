import { KeyChip } from "@/app/components/settings/KeyChip";
import { ChordStrummingDelayControl } from "@/app/components/settings/valueDialogControls/ChordStrummingDelayControl";
import { MetronomeVolumeControl } from "@/app/components/settings/valueDialogControls/MetronomeVolumeControl";
import { TempoControl } from "@/app/components/settings/valueDialogControls/TempoControl";
import { VolumeControl } from "@/app/components/settings/valueDialogControls/VolumeControl";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { Panel } from "@/app/components/uiFramework/Panel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { CONTROL_PANEL_ID } from "@/app/data/elementIds";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setControlPanelExpanded } from "@/app/store/uiSlice";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import React from "react";
import { useDispatch } from "react-redux";
import { ButtonContainer } from "./ButtonContainer";

export const ControlPanel: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const dispatch = useDispatch();
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const controlPanelExpanded = useUiSelector((s) => s.controlPanelExpanded);
  // it should be on the opposite side of chords to avoid overlapping
  const isRight = chordsDisplayMode === ChordsDisplayMode.Left;
  // the arrow points to the screen edge the panel hides into
  const towardsEdge = controlPanelExpanded === isRight;

  return (
    <Panel
      enableReverse
      id={CONTROL_PANEL_ID}
      className={`z-30 opacity-95 fixed top-1 p-1 ${isRight ? "right-1" : "left-1"}`}
      style={{ maxWidth: "calc(100vw - 8px)" }}
    >
      <KeyChip premiumComponents={premiumComponents} />
      {controlPanelExpanded && (
        <>
          <ButtonContainer premiumComponents={premiumComponents} />
          <div className="flex flex-col gap-1">
            <VolumeControl />
            <MetronomeVolumeControl />
          </div>
          <div className="flex flex-col gap-1">
            <TempoControl />
            <ChordStrummingDelayControl />
          </div>
        </>
      )}
      <IconButtonWrapper
        icon={towardsEdge ? <ChevronRight /> : <ChevronLeft />}
        tooltip={controlPanelExpanded ? "Hide controls" : "Show controls"}
        onPress={() => dispatch(setControlPanelExpanded(!controlPanelExpanded))}
      />
    </Panel>
  );
};
