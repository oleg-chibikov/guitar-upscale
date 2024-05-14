import { Theme } from "@/app/data/theme";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { ButtonContainer } from "./buttons/ButtonContainer";
import { ScaleAndGroupSelector } from "./selectors/ScaleAndGroupSelector";

export const ControlPanel: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  return (
    <section
      className={`z-30 p-1 overflow-auto overscroll-contain fixed top-1 border-2 ${
        theme === Theme.Light
          ? "bg-panel-light border-border-light"
          : "bg-panel-dark border-border-dark"
      } ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      } flex ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left
          ? "flex-row-reverse"
          : "flex-row"
      } gap-1 items-start`}
      style={{
        maxWidth: "80vw",
        maxHeight: "60vh",
      }}
    >
      <ScaleAndGroupSelector />
      <ButtonContainer premiumComponents={premiumComponents} />
    </section>
  );
};
