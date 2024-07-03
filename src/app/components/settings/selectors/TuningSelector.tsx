import { Tuning, tunings } from "@/app/data/tunings";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setTuning } from "@/app/store/settingsSlice";
import { setSkinBasedOnStringCount } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { SelectWrapper } from "../../uiFramework/SelectWrapper";

const TuningSelector: React.FC = () => {
  const tuning = useSettingsSelector((s) => s.tuning);
  const dispatch = useDispatch();

  return (
    <SelectWrapper
      value={tuning}
      onChange={(value) => {
        dispatch(setTuning(value as Tuning));
        dispatch(setSkinBasedOnStringCount());
      }}
      options={Object.entries(tunings).map(([tuning, value]) => ({
        value: tuning,
        label: `${value.name} (${tuning})`,
      }))}
    />
  );
};

export { TuningSelector };
