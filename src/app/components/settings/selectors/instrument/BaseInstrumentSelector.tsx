"use client";
import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import {
  Instrument,
  InstrumentGroup,
  instrumentGroups,
} from "@/app/data/instruments";
import { Note } from "@/app/data/notes";
import { playNote } from "@/app/engine/sound/soundProvider";
import { beatToMilliseconds } from "@/app/helpers/clockHelper";
import { convertToTitleCase } from "@/app/helpers/stringHelper";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import {
  reverbStrengthValue,
  tempoBpmValue,
  volumeValue,
} from "@/app/store/settingsSlice";
import React from "react";
import { SelectWrapper } from "../../../uiFramework/SelectWrapper";

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
  const isOnline = useOnlineStatus();
  const tooltip = isOnline
    ? undefined
    : "Instrument selection is disabled while offline (it might need to download new sound)";
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
      beatToMilliseconds(tempoBpmValue)
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
        disabled={!isOnline}
        tooltip={tooltip}
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
        disabled={!isOnline}
        tooltip={tooltip}
      />
    </ControlWithLabel>
  );
};

export { BaseInstrumentSelector };
