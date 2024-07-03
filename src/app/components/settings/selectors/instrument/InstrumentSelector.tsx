"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setInstrument, setInstrumentGroup } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { BaseInstrumentSelector } from "./BaseInstrumentSelector";

const InstrumentSelector: React.FC = () => {
  const instrument = useSettingsSelector((s) => s.instrument);
  const instrumentGroup = useSettingsSelector((s) => s.instrumentGroup);

  const dispatch = useDispatch();
  return (
    <BaseInstrumentSelector
      label="Lead instrument"
      instrument={instrument}
      instrumentGroup={instrumentGroup}
      setInstrument={(value) => dispatch(setInstrument(value))}
      setInstrumentGroup={(value) => dispatch(setInstrumentGroup(value))}
    />
  );
};

export { InstrumentSelector };
