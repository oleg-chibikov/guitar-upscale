"use client";
import { ControlWithLabel } from "@/app/components/layout/ControlWithLabel";
import {
  Instrument,
  InstrumentGroup,
  instrumentGroups,
} from "@/app/data/instruments";
import { Note } from "@/app/data/notes";
import { playNote } from "@/app/engine/sound/soundProvider";
import { beatToMilliseconds } from "@/app/helpers/clockHelper";
import { convertToTitleCase } from "@/app/helpers/stringHelper";
import {
  reverbStrengthValue,
  selectSettings,
  volumeValue,
} from "@/app/store/settingsSlice";
import React from "react";
import { useSelector } from "react-redux";
import { SelectWrapper } from "../SelectWrapper";

interface BaseInstrumentSelectorProps {
  label: string;
  instrumentGroup: InstrumentGroup;
  instrument: Instrument;
  setInstrumentGroup: (value: InstrumentGroup) => void;
  setInstrument: (value: Instrument) => void;
}

const BaseInstrumentSelector: React.FC<BaseInstrumentSelectorProps> = ({
  label,
  instrument,
  instrumentGroup,
  setInstrumentGroup,
  setInstrument,
}) => {
  const { tempoBpm } = useSelector(selectSettings);

  const handleGroupChange = async (group: InstrumentGroup) => {
    setInstrumentGroup(group);

    // Select the first instrument from the group
    const instrumentsInGroup = instrumentGroups[group];
    if (instrumentsInGroup.length) {
      await handleInstrumentChange(instrumentsInGroup[0]);
    }
  };

  const handleInstrumentChange = async (value: string) => {
    setInstrument(value as Instrument);
    await playNote(
      { note: Note.E, octave: 5 },
      volumeValue,
      value,
      reverbStrengthValue,
      beatToMilliseconds(tempoBpm)
    );
  };

  const group: Instrument[] = instrumentGroups[instrumentGroup];
  return (
    <ControlWithLabel label={label}>
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
    </ControlWithLabel>
  );
};

export { BaseInstrumentSelector };
