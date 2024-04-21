import { Tuning, tunings } from "@/app/data/notes";
import { selectControlPanel, setTuning } from "@/app/store/controlPanelSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const TuningSelector: React.FC = () => {
  const { tuning } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <>
      <span>Tuning:</span>
      <SelectWrapper
        value={tuning}
        onChange={(value) => {
          dispatch(setTuning(value as Tuning));
        }}
        options={Object.entries(tunings).map(([key, value]) => {
          const tuningWithoutOctaves = key.split("|")[0];
          return {
            value: tuningWithoutOctaves,
            label: `${value} (${tuningWithoutOctaves})`,
          };
        })}
      />
    </>
  );
};

export { TuningSelector };
