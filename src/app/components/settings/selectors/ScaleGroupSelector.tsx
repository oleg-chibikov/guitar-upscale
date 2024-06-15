import { scalesMap } from "@/app/data/scales";
import { useExamples } from "@/app/hooks/useExamples";
import { selectSettings, setScaleGroup } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const ScaleGroupSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectSettings);
  const examplesMap = useExamples();
  const dispatch = useDispatch();

  return (
    <SelectWrapper
      large
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
