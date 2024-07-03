import { scalesMap } from "@/app/data/scales";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useExamples } from "@/app/hooks/useExamples";
import { setScaleGroup } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { SelectWrapper } from "../../uiFramework/SelectWrapper";

const ScaleGroupSelector: React.FC = () => {
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const examplesMap = useExamples();
  const dispatch = useDispatch();

  return (
    <SelectWrapper
      value={scaleGroup}
      onChange={(value) => {
        dispatch(setScaleGroup(value as string));
      }}
      options={Array.from(scalesMap.entries()).map(([groupName]) => {
        const examples = examplesMap?.get(groupName);
        return {
          value: groupName,
          label: groupName + (examples ? "*" : ""),
        };
      })}
    />
  );
};

export { ScaleGroupSelector };
