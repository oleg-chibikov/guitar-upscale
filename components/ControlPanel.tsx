// ControlPanel.tsx
import { Picker } from "@react-native-picker/picker";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Play } from "./Play";

import { Note, stringTuning } from "../data/notes";
import { scalesMap } from "../data/scales";
import { ShowNoteMode } from "../data/showNoteMode";
import { generateNeckRepresentation } from "../engine/generateNeckRepresentation";
import {
  selectControlPanel,
  setNeck,
  setSelectedBaseNote,
  setSelectedScale,
  setSelectedShowNoteMode,
} from "../store/controlPanelSlice";
import tw from "../tailwind";

const ControlPanel: React.FC = () => {
  const { selectedScale, selectedBaseNote, selectedShowNoteMode, neck } =
    useSelector(selectControlPanel);
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedBaseNote === null) {
      return;
    }

    const scalePattern = new Set(scalesMap.get(selectedScale));
    const neck = generateNeckRepresentation(
      scalePattern,
      stringTuning,
      selectedBaseNote
    );

    dispatch(setNeck(neck));
  }, [selectedBaseNote, selectedScale, stringTuning]);

  return (
    <View
      style={[
        tw`top-0 left-0 z-10 flex gap-4 flex-row ml-16 mt-4`,
        { position: "fixed" },
      ]}
    >
      {/* Scale Picker */}
      <Picker
        style={tw`text-2xl`}
        selectedValue={selectedScale}
        onValueChange={(scale) => {
          dispatch(setSelectedScale(scale));
        }}
      >
        {Array.from(scalesMap.entries()).map((scale, index) => (
          <Picker.Item key={index} label={scale[0]} value={scale[0]} />
        ))}
      </Picker>

      {/* Base Note Picker */}
      <Picker
        style={tw`text-2xl`}
        selectedValue={selectedBaseNote}
        onValueChange={(itemValue) => {
          dispatch(
            setSelectedBaseNote(parseInt(itemValue as unknown as string))
          ); // Assuming itemValue is of type Note
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

      {/* Show Note Mode Picker */}
      <Picker
        style={tw`text-2xl`}
        selectedValue={selectedShowNoteMode}
        onValueChange={(mode) => {
          dispatch(
            setSelectedShowNoteMode(parseInt(mode as unknown as string))
          ); // Assuming mode is of type ShowNoteMode
        }}
      >
        {Object.entries(ShowNoteMode)
          .filter(([key]) => isNaN(key as any))
          .map(([key, value]) => (
            <Picker.Item key={key} label={key} value={value} />
          ))}
      </Picker>

      {/* Play Component */}
      {neck && <Play />}
    </View>
  );
};

export default ControlPanel;
