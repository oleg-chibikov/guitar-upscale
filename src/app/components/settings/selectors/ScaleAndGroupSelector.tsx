import React from "react";
import { useSelector } from "react-redux";

import { TwoSelectors } from "@/app/components/settings/selectors/TwoSelectors";
import { selectSettings } from "@/app/store/settingsSlice";
import { ScaleGroupSelector } from "./ScaleGroupSelector";
import { ScaleSelector } from "./ScaleSelector";

export const ScaleAndGroupSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectSettings);

  return (
    <TwoSelectors>
      <span>Style:</span>
      <ScaleGroupSelector />
      {scaleGroup && (
        <>
          <span>Scale:</span>
          <ScaleSelector />
        </>
      )}
    </TwoSelectors>
  );
};
