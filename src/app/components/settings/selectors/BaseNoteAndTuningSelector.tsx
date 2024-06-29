import React from "react";

import { BaseNoteSelector } from "@/app/components/settings/selectors/BaseNoteSelector";
import { TuningSelector } from "@/app/components/settings/selectors/TuningSelector";
import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import { useSelector } from "react-redux";

export const BaseNoteAndTuningSelector: React.FC = () => {
  const { theme } = useSelector(selectUi);
  return (
    <section
      className={`p-1 w-24 gap-1 flex flex-col ${
        theme === Theme.Light
          ? "text-foreground-light bg-accented_background-light"
          : "text-foreground-dark bg-accented_background-dark"
      }`}
    >
      <BaseNoteSelector />
      <TuningSelector />
    </section>
  );
};
