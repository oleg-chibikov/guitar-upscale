import { scalesMap } from "@/app/data/scales";
import { useExamples } from "@/app/hooks/useExamples";
import { selectControlPanel, setScale } from "@/app/store/controlPanelSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const ScaleSelector: React.FC = () => {
  const { scale, scaleGroup } = useSelector(selectControlPanel);
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
          const exampleCount = examples?.length;
          const asterisk = exampleCount ? ` (${exampleCount} ex.)` : "";

          return {
            value: scaleName,
            label: scaleName + asterisk,
          };
        }
      )}
      value={scale}
      onChange={(value) => {
        dispatch(setScale(value as string));
      }}
    />
  );
};

export { ScaleSelector };
