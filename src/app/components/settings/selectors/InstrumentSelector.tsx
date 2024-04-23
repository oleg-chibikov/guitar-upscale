"use client";
import {
  Instrument,
  InstrumentGroup,
  instrumentGroups,
} from "@/app/data/instruments";
import { Note } from "@/app/data/notes";
import { playNote } from "@/app/engine/sound/soundProvider";
import { convertToTitleCase } from "@/app/helpers/stringHelper";
import {
  selectSettings,
  setInstrument,
  setInstrumentGroup,
  velocityValue,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const InstrumentSelector: React.FC = () => {
  const { instrument, instrumentGroup, reverbStrength, velocity } =
    useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleGroupChange = (group: InstrumentGroup) => {
    dispatch(setInstrumentGroup(group));
  };

  const handleInstrumentChange = async (value: string) => {
    dispatch(setInstrument(value as Instrument));
    await playNote(
      { note: Note.E, octave: 5 },
      velocityValue ?? velocity,
      value,
      reverbStrength
    );
  };

  const group: Instrument[] = instrumentGroups[instrumentGroup];
  return (
    <>
      <span>Instrument:</span>
      <SelectWrapper
        value={instrumentGroup}
        onChange={(value) => handleGroupChange(value as InstrumentGroup)}
        options={Object.keys(instrumentGroups).map((group) => ({
          value: group,
          label: group,
        }))}
      />
      <SelectWrapper
        value={instrument}
        onChange={(value) => handleInstrumentChange(value as Instrument)}
        options={
          instrumentGroup
            ? group.map((instrument) => ({
                value: instrument,
                label: convertToTitleCase(instrument),
              }))
            : []
        }
      />
    </>
  );
};

export { InstrumentSelector };
