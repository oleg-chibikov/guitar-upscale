import React from "react";
import { useSelector } from "react-redux";

import { Theme, selectControlPanel } from "../../../store/controlPanelSlice";
import { ScaleGroupSelector } from "./ScaleGroupSelector";
import { ScaleSelector } from "./ScaleSelector";

export const ScaleAndGroupSelector: React.FC = () => {
  const { scaleGroup, theme } = useSelector(selectControlPanel);

  return (
    <section
      className={`opacity-95 p-1 gap-3 grid ${
        theme === Theme.Light
          ? "text-foreground-light bg-accented_background-light"
          : "text-foreground-dark bg-accented_background-dark"
      }`}
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
