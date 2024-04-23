"use client";
import {
  Instrument,
  InstrumentGroup,
  instrumentGroups,
} from "@/app/data/instruments";
import { Note } from "@/app/data/notes";
import { quarterBeatToMilliseconds } from "@/app/engine/mainClock";
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
  const { instrument, instrumentGroup, reverbStrength, velocity, tempoBpm } =
    useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleGroupChange = async (group: InstrumentGroup) => {
    dispatch(setInstrumentGroup(group));

    // Select the first instrument from the group
    const instrumentsInGroup = instrumentGroups[group];
    if (instrumentsInGroup && instrumentsInGroup.length > 0) {
      await handleInstrumentChange(instrumentsInGroup[0]);
    }
  };

  const handleInstrumentChange = async (value: string) => {
    dispatch(setInstrument(value as Instrument));
    await playNote(
      { note: Note.E, octave: 5 },
      velocityValue ?? velocity,
      value,
      reverbStrength,
      quarterBeatToMilliseconds(tempoBpm)
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
