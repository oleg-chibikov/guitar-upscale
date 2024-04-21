import { scalesMap } from "@/app/data/scales";
import { useExamples } from "@/app/hooks/useExamples";
import {
  selectControlPanel,
  setScaleGroup,
} from "@/app/store/controlPanelSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const ScaleGroupSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectControlPanel);
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
