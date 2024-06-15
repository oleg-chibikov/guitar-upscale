import { Tuning, tunings } from "@/app/data/tunings";
import { selectSettings, setTuning } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const TuningSelector: React.FC = () => {
  const { tuning } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <SelectWrapper
      large
      value={tuning}
      onChange={(value) => {
        dispatch(setTuning(value as Tuning));
      }}
      options={Object.entries(tunings).map(([tuning, value]) => ({
        value: tuning,
        label: `${value.name} (${tuning})`,
      }))}
    />
  );
};

export { TuningSelector };
