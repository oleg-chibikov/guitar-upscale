import React from "react";
import { useSelector } from "react-redux";

import { selectControlPanel } from "../../../store/controlPanelSlice";
import { ScaleGroupSelector } from "./ScaleGroupSelector";
import { ScaleSelector } from "./ScaleSelector";

export const ScaleAndGroupSelector: React.FC = () => {
  const { scaleGroup, bg, textStyle } = useSelector(selectControlPanel);

  return (
    <section
      className={`${bg} opacity-95 p-1 gap-3 grid ${textStyle}`}
      style={{
        gridTemplateColumns: "auto minmax(100px, auto)",
      }}
    >
      <span>Style:</span>
      <ScaleGroupSelector />
      {scaleGroup && (
        <>
          <span>Scale:</span>
          <ScaleSelector />
        </>
      )}
    </section>
  );
};
