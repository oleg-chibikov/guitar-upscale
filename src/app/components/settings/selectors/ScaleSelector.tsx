import { scalesMap } from "@/app/data/scales";
import { useExamples } from "@/app/hooks/useExamples";
import { selectSettings, setScale } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const ScaleSelector: React.FC = () => {
  const { scale, scaleGroup } = useSelector(selectSettings);
  const dispatch = useDispatch();
  const examplesMap = useExamples();

  if (!scaleGroup) {
    return null;
  }

  return (
    <SelectWrapper
      large
      options={Array.from(scalesMap.get(scaleGroup)!.entries()).map(
        ([scaleName]) => {
          const examples = examplesMap?.get(scaleGroup)?.get(scaleName);
          const exampleCount = examples?.length ?? 0;
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
