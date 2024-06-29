import React from "react";
import { useSelector } from "react-redux";

import { selectSettings } from "@/app/store/settingsSlice";
import { ScaleGroupSelector } from "./ScaleGroupSelector";
import { ScaleSelector } from "./ScaleSelector";

import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";

export const ScaleAndGroupSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectSettings);
  const { theme } = useSelector(selectUi);

  return (
    <section
      className={`p-1 gap-1 grid ${
        theme === Theme.Light
          ? "text-foreground-light bg-accented_background-light"
          : "text-foreground-dark bg-accented_background-dark"
      }`}
      style={{
        gridTemplateColumns: "auto 85px",
      }}
    >
      <ControlWithLabel label="Style">
        <ScaleGroupSelector />
      </ControlWithLabel>
      {scaleGroup && (
        <ControlWithLabel label="Scale">
          <ScaleSelector />
        </ControlWithLabel>
      )}
    </section>
  );
};
