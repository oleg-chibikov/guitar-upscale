import { scalesMap } from "@/app/data/scales";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useExamples } from "@/app/hooks/useExamples";
import { setScale } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { SelectWrapper } from "../../uiFramework/SelectWrapper";

const ScaleSelector: React.FC = () => {
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const dispatch = useDispatch();
  const examplesMap = useExamples();

  if (!scaleGroup) {
    return null;
  }

  return (
    <SelectWrapper
      options={Array.from(scalesMap.get(scaleGroup)!.entries()).map(
        ([scaleName]) => {
          const examples = examplesMap?.get(scaleGroup)?.get(scaleName);
          const exampleCount = examples?.length ?? 0;
          const asterisk = exampleCount ? ` (${exampleCount} ex.)` : "";

          return {
            value: scaleName,
            label: scaleName + asterisk,
          };
        },
      )}
      value={scale}
      onChange={(value) => {
        dispatch(setScale(value as string));
      }}
    />
  );
};

export { ScaleSelector };
