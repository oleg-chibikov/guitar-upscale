import { Picker } from "@react-native-picker/picker";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
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
  setSettingsExpanded,
} from "../store/controlPanelSlice";
import tw from "../tailwind";
import IconButton from "./IconButton";

const ControlPanel: React.FC = () => {
  const {
    selectedScale,
    selectedBaseNote,
    selectedShowNoteMode,
    neck,
    settingsExpanded,
  } = useSelector(selectControlPanel);
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
    <>
      <View
        style={[
          tw`z-10 top-3 left-3 flex flex-row gap-4 items-center`,
          { position: "fixed" },
        ]}
      >
        <IconButton
          icon="⚙️"
          onPress={() => dispatch(setSettingsExpanded(!settingsExpanded))}
        />
        {neck && <Play />}
      </View>
      {settingsExpanded && (
        <View
          style={[
            tw`left-3 z-20 top-20 bg-gray-200 p-2 rounded-lg`,
            {
              position: "fixed",
              display: "grid",
              gridTemplateColumns: "auto auto",
              gridTemplateRows: "repeat(3, auto)",
              gap: "10px", // Adjust the gap as needed
            },
          ]}
        >
          <Text style={tw`text-lg mb-2`}>Scale:</Text>
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

          <Text style={tw`text-lg mb-2`}>Base Note:</Text>
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

          <Text style={tw`text-lg mb-2`}>Note Mode:</Text>
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
        </View>
      )}
    </>
  );
};

export default ControlPanel;
