import { Picker } from "@react-native-picker/picker";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { PlayButton } from "./PlayButton";

import { NoteDisplayMode } from "../data/noteDisplayMode";
import { Note, stringTuning } from "../data/notes";
import {
  checkDuplicateScales,
  getScaleExamples,
  getScaleNotes,
  scalesMap,
} from "../data/scales";
import { generateNeckRepresentation } from "../engine/generateNeckRepresentation";
import {
  selectControlPanel,
  setExamples,
  setNeck,
  setSelectedBaseNote,
  setSelectedNoteDisplayMode,
  setSelectedScale,
  setSelectedScaleGroup,
  setSettingsExpanded,
} from "../store/controlPanelSlice";
import tw from "../tailwind";
import IconButton from "./IconButton";
import PlayIntervalSlider from "./PlayIntervalSlider";
import VelocitySlider from "./VelocitySlider";

const ControlPanel: React.FC = () => {
  const {
    selectedScale,
    selectedScaleGroup,
    selectedBaseNote,
    selectedNoteDisplayMode,
    neck,
    settingsExpanded,
  } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedBaseNote === null || !selectedScaleGroup || !selectedScale) {
      return;
    }

    const scaleObject = scalesMap.get(selectedScaleGroup)!.get(selectedScale);

    let scaleNotes = getScaleNotes(scaleObject);

    const scalePattern = new Set(scaleNotes?.concat([0]));

    // Debug
    checkDuplicateScales(scalesMap);

    const neck = generateNeckRepresentation(
      scalePattern,
      stringTuning,
      selectedBaseNote
    );
    dispatch(setNeck(neck));

    setExamples(getScaleExamples(scaleObject));
  }, [selectedBaseNote, selectedScale, selectedScaleGroup, stringTuning]);

  const scales = scalesMap;

  return (
    <>
      <View
        style={[
          tw`z-10 top-3 left-3 flex flex-row gap-2 items-center`,
          { position: "fixed" },
        ]}
      >
        <View
          style={[
            tw`bg-gray-200 p-2 rounded-md gap-2`,
            {
              display: "grid",
              gridTemplateColumns: "auto minmax(200px, auto)",
            },
          ]}
        >
          <Text style={tw`text-md`}>Style:</Text>
          <Picker
            style={tw`text-md`}
            selectedValue={selectedScaleGroup}
            onValueChange={(value) => {
              dispatch(setSelectedScaleGroup(value));
            }}
          >
            {Array.from(scales.entries()).map((scale, index) => (
              <Picker.Item key={index} label={scale[0]} value={scale[0]} />
            ))}
          </Picker>
          {selectedScaleGroup && (
            <>
              <Text style={tw`text-md`}>Scale:</Text>
              <Picker
                style={tw`text-md`}
                selectedValue={selectedScale}
                onValueChange={(value) => {
                  dispatch(setSelectedScale(value));
                }}
              >
                {Array.from(scales.get(selectedScaleGroup)!.entries()).map(
                  (scale, index) => (
                    <Picker.Item
                      key={index}
                      label={scale[0]}
                      value={scale[0]}
                    />
                  )
                )}
              </Picker>
            </>
          )}
        </View>
        <IconButton
          icon="⚙️"
          onPress={() => dispatch(setSettingsExpanded(!settingsExpanded))}
        />
        {neck && <PlayButton />}
      </View>
      {settingsExpanded && (
        <View
          style={[
            tw`left-3 z-20 top-25 bg-gray-200 p-2 rounded-md gap-2`,
            {
              position: "fixed",
              display: "grid",
              gridTemplateColumns: "auto minmax(200px, auto)",
            },
          ]}
        >
          <Text style={tw`text-md`}>Base Note:</Text>
          <Picker
            style={tw`text-md`}
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

          <Text style={tw`text-md`}>Note Display Mode:</Text>
          <Picker
            style={tw`text-md`}
            selectedValue={selectedNoteDisplayMode}
            onValueChange={(mode) => {
              dispatch(
                setSelectedNoteDisplayMode(parseInt(mode as unknown as string))
              ); // Assuming mode is of type NoteDisplayMode
            }}
          >
            {Object.entries(NoteDisplayMode)
              .filter(([key]) => isNaN(key as any))
              .map(([key, value]) => (
                <Picker.Item key={key} label={key} value={value} />
              ))}
          </Picker>
          <Text style={tw`text-md`}>Play Interval:</Text>
          <PlayIntervalSlider />
          <Text style={tw`text-md`}>Note Velocity:</Text>
          <VelocitySlider />
        </View>
      )}
    </>
  );
};

export default ControlPanel;
