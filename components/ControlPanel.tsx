import { Picker } from "@react-native-picker/picker";
import React from "react";
import { View } from "react-native";
import { Note } from "../data/notes";
import { scalesMap } from "../data/scales";
import { ShowNoteMode } from "../data/showNoteMode";
import { Neck } from "../engine/generateNeckRepresentation";
import tw from "../tailwind";
import { Play } from "./Play";

interface ControlPanelProps {
  selectedScale: string;
  setSelectedScale: (scale: string) => void;
  selectedBaseNote: Note;
  setSelectedBaseNote: (note: Note) => void;
  selectedShowNoteMode: ShowNoteMode;
  setSelectedShowNoteMode: (mode: ShowNoteMode) => void;
  neck: Neck;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedScale,
  setSelectedScale,
  selectedBaseNote,
  setSelectedBaseNote,
  selectedShowNoteMode,
  setSelectedShowNoteMode,
  neck,
}) => {
  return (
    <View
      style={[
        tw`top-0 left-0 z-10 flex gap-4 flex-row ml-16 mt-4`,
        { position: "fixed" },
      ]}
    >
      <Picker
        style={tw`text-2xl`}
        selectedValue={selectedScale}
        onValueChange={(scale) => {
          setSelectedScale(scale);
        }}
      >
        {Array.from(scalesMap.entries()).map((scale, index) => (
          <Picker.Item key={index} label={scale[0]} value={scale[0]} />
        ))}
      </Picker>

      <Picker
        style={tw`text-2xl`}
        selectedValue={selectedBaseNote}
        onValueChange={(itemValue) => {
          setSelectedBaseNote(parseInt(itemValue as unknown as string));
        }}
      >
        {Object.entries(Note)
          .filter(([key]) => isNaN(key as any))
          .map(([key, value]) => (
            <Picker.Item
              key={key}
              label={key + "(" + (value === 0 ? "" : "+") + value + ")"}
              value={value}
            />
          ))}
      </Picker>
      <Picker
        style={tw`text-2xl`}
        selectedValue={selectedShowNoteMode}
        onValueChange={(mode) => {
          setSelectedShowNoteMode(parseInt(mode as unknown as string));
        }}
      >
        {Object.entries(ShowNoteMode)
          .filter(([key]) => isNaN(key as any))
          .map(([key, value]) => (
            <Picker.Item key={key} label={key} value={value} />
          ))}
      </Picker>
      <Play neck={neck} stopSignal={selectedScale + selectedBaseNote} />
    </View>
  );
};
