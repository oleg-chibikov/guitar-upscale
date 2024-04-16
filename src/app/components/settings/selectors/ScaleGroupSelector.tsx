import { scalesMap } from "@/app/data/scales";
import {
  selectControlPanel,
  setScaleGroup,
} from "@/app/store/controlPanelSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const ScaleGroupSelector: React.FC = () => {
  const { scaleGroup } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <SelectWrapper
      className="text-md"
      value={scaleGroup}
      onChange={(value) => {
        dispatch(setScaleGroup(value as string));
      }}
      options={Array.from(scalesMap.entries()).map(([groupName]) => ({
        value: groupName,
        label: groupName,
      }))}
    />
  );
};

export { ScaleGroupSelector };
