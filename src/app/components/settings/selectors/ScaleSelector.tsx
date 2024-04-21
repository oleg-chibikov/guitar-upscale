import { scalesMap } from "@/app/data/scales";
import { selectControlPanel, setScale } from "@/app/store/controlPanelSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const ScaleSelector: React.FC = () => {
  const { scale, scaleGroup } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  if (!scaleGroup) {
    return null;
  }

  return (
    <SelectWrapper
      options={Array.from(scalesMap.get(scaleGroup)!.entries()).map(
        ([scaleName]) => ({
          value: scaleName,
          label: scaleName, // TODO: asterisk with examples, but only if examples are available as a feature
        })
      )}
      value={scale}
      onChange={(value) => {
        dispatch(setScale(value as string));
      }}
    />
  );
};

export { ScaleSelector };
