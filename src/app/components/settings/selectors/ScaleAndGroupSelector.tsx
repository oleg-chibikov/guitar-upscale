import React from "react";

import { ScaleGroupSelector } from "./ScaleGroupSelector";
import { ScaleSelector } from "./ScaleSelector";

import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { Theme } from "@/app/data/theme";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";

export const ScaleAndGroupSelector: React.FC = () => {
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const theme = useUiSelector((s) => s.theme);

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
