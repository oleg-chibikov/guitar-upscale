import React from "react";

import { CapoSelector } from "@/app/components/settings/selectors/CapoSelector";
import { TuningSelector } from "@/app/components/settings/selectors/TuningSelector";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";

export const CapoAndTuningSelector: React.FC = () => {
  const theme = useUiSelector((s) => s.theme);
  return (
    <section
      className={`p-1 w-24 gap-1 flex flex-col ${
        theme === Theme.Light
          ? "text-foreground-light bg-accented_background-light"
          : "text-foreground-dark bg-accented_background-dark"
      }`}
    >
      <CapoSelector />
      <TuningSelector />
    </section>
  );
};
