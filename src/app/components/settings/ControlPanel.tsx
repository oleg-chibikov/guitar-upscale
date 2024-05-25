import { TempoControl } from "@/app/components/settings/valueModalControls/TempoControl";
import { VolumeControl } from "@/app/components/settings/valueModalControls/VelocityControl";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { ButtonContainer } from "./buttons/ButtonContainer";
import { ScaleAndGroupSelector } from "./selectors/ScaleAndGroupSelector";

export const ControlPanel: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  return (
    <section
      className={`z-30 flex ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left
          ? "flex-row-reverse"
          : "flex-row"
      } gap-1 items-center p-1 overflow-auto overscroll-contain fixed top-1 border-2 ${
        theme === Theme.Light
          ? "bg-panel-light border-border-light"
          : "bg-panel-dark border-border-dark"
      } ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      }`}
      style={{
        maxWidth: "80vw",
        maxHeight: "60vh",
      }}
    >
      <ScaleAndGroupSelector />
      <ButtonContainer premiumComponents={premiumComponents} />
      <div className="flex flex-col gap-1">
        <VolumeControl />
        <TempoControl />
      </div>
    </section>
  );
};
