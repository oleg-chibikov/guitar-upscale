import { Picker } from "@react-native-picker/picker";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { PlayButton } from "./PlayButton";

import { NoteDisplayMode } from "../data/noteDisplayMode";
import { Note, stringTuning } from "../data/notes";
import { scalesMap } from "../data/scales";
import { generateNeckRepresentation } from "../engine/generateNeckRepresentation";
import {
  selectControlPanel,
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

    const scalePattern = new Set(
      scalesMap.get(selectedScaleGroup)!.get(selectedScale)?.concat([0])
    );

    // Debug - check duplicates
    function checkDuplicateScales(
      scalesMap: Map<string, Map<string, number[]>>
    ): void {
      // Create a Map to store encountered scales and their names
      const encounteredScales = new Map<string, string>();

      // Iterate through each group
      for (const [group, groupMap] of scalesMap.entries()) {
        // Iterate through each scale within the group
        for (const [scaleName, scale] of groupMap.entries()) {
          const scaleString = JSON.stringify(scale);

          // If the scale is encountered more than once, log the duplicate
          if (encounteredScales.has(scaleString)) {
            console.log(
              `Duplicate found: Scale '${scaleName}' in '${group}' duplicates '${encounteredScales.get(
                scaleString
              )}'`
            );
          } else {
            // Otherwise, add the scale to the map
            encounteredScales.set(scaleString, scaleName);
          }
        }
      }
    }

    // Example usage:
    checkDuplicateScales(scalesMap);

    const neck = generateNeckRepresentation(
      scalePattern,
      stringTuning,
      selectedBaseNote
    );

    dispatch(setNeck(neck));
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
        <IconButton
          icon="⚙️"
          onPress={() => dispatch(setSettingsExpanded(!settingsExpanded))}
        />
        {neck && <PlayButton />}
        <View style={[tw`flex flex-column gap-1`]}>
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
            <Picker
              style={tw`text-md`}
              selectedValue={selectedScale}
              onValueChange={(value) => {
                dispatch(setSelectedScale(value));
              }}
            >
              {Array.from(scales.get(selectedScaleGroup)!.entries()).map(
                (scale, index) => (
                  <Picker.Item key={index} label={scale[0]} value={scale[0]} />
                )
              )}
            </Picker>
          )}
        </View>
      </View>
      {settingsExpanded && (
        <View
          style={[
            tw`left-3 z-20 top-20 bg-gray-200 p-2 rounded-md`,
            {
              position: "fixed",
              display: "grid",
              gridTemplateColumns: "auto minmax(200px, auto)",
              gridTemplateRows: "repeat(3, auto)",
              gap: "10px", // Adjust the gap as needed
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
          <Text style={tw`text-md`}>Play Interval (ms):</Text>
          <PlayIntervalSlider />
        </View>
      )}
    </>
  );
};

export default ControlPanel;
