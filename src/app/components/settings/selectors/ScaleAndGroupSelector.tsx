import React from "react";
import { useSelector } from "react-redux";

import { Theme } from "@/app/data/theme";
import { selectSettings } from "@/app/store/settingsSlice";
import { selectUi } from "@/app/store/uiSlice";
import { ScaleGroupSelector } from "./ScaleGroupSelector";
import { ScaleSelector } from "./ScaleSelector";

export const ScaleAndGroupSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectSettings);
  const { theme } = useSelector(selectUi);

  return (
    <section
      className={`opacity-95 p-1 gap-3 grid ${
        theme === Theme.Light
          ? "text-foreground-light bg-accented_background-light"
          : "text-foreground-dark bg-accented_background-dark"
      }`}
      style={{
        gridTemplateColumns: "auto auto",
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
