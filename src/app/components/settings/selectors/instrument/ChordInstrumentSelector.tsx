"use client";
import {
  selectSettings,
  setChordInstrument,
  setChordInstrumentGroup,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseInstrumentSelector } from "./BaseInstrumentSelector";

const InstrumentSelector: React.FC = () => {
  const { chordInstrument, chordInstrumentGroup } = useSelector(selectSettings);
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
