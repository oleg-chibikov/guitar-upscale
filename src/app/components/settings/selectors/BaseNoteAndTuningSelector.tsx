import React from "react";
import { useSelector } from "react-redux";

import { BaseNoteSelector } from "@/app/components/settings/selectors/BaseNoteSelector";
import { TuningSelector } from "@/app/components/settings/selectors/TuningSelector";
import { TwoSelectors } from "@/app/components/settings/selectors/TwoSelectors";
import { selectSettings } from "@/app/store/settingsSlice";

export const BaseNoteAndTuningSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectSettings);

  return (
    <TwoSelectors>
      <span>Capo:</span>
      <BaseNoteSelector />
      {scaleGroup && (
        <>
          <span>Tuning:</span>
          <TuningSelector />
        </>
      )}
    </TwoSelectors>
  );
};
