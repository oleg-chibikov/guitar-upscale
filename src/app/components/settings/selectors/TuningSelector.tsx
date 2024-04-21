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
        options={Object.entries(tunings).map(([tuning, value]) => ({
          value: tuning,
          label: `${value} (${tuning})`,
        }))}
      />
    </>
  );
};

export { TuningSelector };
