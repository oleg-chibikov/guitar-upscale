"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import {
  setChordInstrument,
  setChordInstrumentGroup,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { BaseInstrumentSelector } from "./BaseInstrumentSelector";

const InstrumentSelector: React.FC = () => {
  const chordInstrument = useSettingsSelector((s) => s.chordInstrument);
  const chordInstrumentGroup = useSettingsSelector(
    (s) => s.chordInstrumentGroup,
  );
  const dispatch = useDispatch();
  return (
    <BaseInstrumentSelector
      label="Chord instrument"
      instrument={chordInstrument}
      instrumentGroup={chordInstrumentGroup}
      setInstrument={(value) => dispatch(setChordInstrument(value))}
      setInstrumentGroup={(value) => dispatch(setChordInstrumentGroup(value))}
    />
  );
};

export { InstrumentSelector };
