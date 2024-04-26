"use client";
import {
  selectSettings,
  setInstrument,
  setInstrumentGroup,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseInstrumentSelector } from "./BaseInstrumentSelector";

const InstrumentSelector: React.FC = () => {
  const { instrument, instrumentGroup } = useSelector(selectSettings);
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
