import { KeyChip } from "@/app/components/settings/KeyChip";
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
      className={`fixed top-1 z-30 p-1 opacity-95 ${isRight ? "right-1" : "left-1"}`}
      style={{ maxWidth: "calc(100vw - 8px)" }}
    >
      <KeyChip premiumComponents={premiumComponents} />
      {controlPanelExpanded && (
        <ButtonContainer premiumComponents={premiumComponents} />
      )}
      <IconButtonWrapper
        icon={towardsEdge ? <ChevronRight /> : <ChevronLeft />}
        tooltip={controlPanelExpanded ? "Hide controls" : "Show controls"}
        onPress={() => dispatch(setControlPanelExpanded(!controlPanelExpanded))}
      />
    </Panel>
  );
};
