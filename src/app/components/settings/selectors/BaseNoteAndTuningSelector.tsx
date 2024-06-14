import React from "react";

import { BaseNoteSelector } from "@/app/components/settings/selectors/BaseNoteSelector";
import { TuningSelector } from "@/app/components/settings/selectors/TuningSelector";
import { TwoSelectors } from "@/app/components/settings/selectors/TwoSelectors";

export const BaseNoteAndTuningSelector: React.FC = () => {
  return (
    <TwoSelectors>
      <span>Capo:</span>
      <BaseNoteSelector />
      <span>Tuning:</span>
      <TuningSelector />
    </TwoSelectors>
  );
};
