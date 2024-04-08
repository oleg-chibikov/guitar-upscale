import React, { useEffect, useMemo } from "react";
import { StyleProp, TextStyle, View } from "react-native";
import { useDispatch } from "react-redux";
import { stringTuning } from "../../data/notes";
import { getScaleNotes, scalesMap } from "../../data/scales";
import { generateNeckRepresentation } from "../../engine/generateNeckRepresentation";
import {
  Theme,
  selectControlPanel,
  setChordsExpanded,
  setNeck,
  setSelectedScale,
  setSelectedScaleGroup,
  setSettingsExpanded,
} from "../../store/controlPanelSlice";
import { useAppSelector } from "../../store/store";
import { tw } from "../../tailwind";
import { IconButton } from "../IconButton";
import { ChordsView } from "../Chords/ChordsView";
import { PlayButton } from "./PlayButton";
import { ScaleSelector } from "./ScaleSelector";
import { SettingsView } from "./SettingsView";

export const ControlPanel: React.FC = () => {
  const {
    selectedScale,
    selectedScaleGroup,
    selectedBaseNote,
    settingsExpanded,
    chordsExpanded,
    theme,
    switchToChromaticScale,
  } = useAppSelector(selectControlPanel);
  const dispatch = useDispatch();
  if (selectedBaseNote === null || !selectedScaleGroup || !selectedScale) {
    return null;
  }
  const neck = useMemo(() => {
    // TODO: Check why debugger ends up in this method even when it should have memoized the neck
    const scaleObject = scalesMap.get(selectedScaleGroup)!.get(selectedScale);
    let scaleNotes = getScaleNotes(scaleObject);
    const scalePattern = new Set(scaleNotes?.concat([0]));

    // Just for debug
    // checkDuplicateScales(scalesMap);
    return generateNeckRepresentation(
      scalePattern,
      stringTuning,
      selectedBaseNote
    );
  }, [selectedBaseNote, selectedScale, selectedScaleGroup, stringTuning]);

  useEffect(() => {
    if (neck) {
      dispatch(setNeck(neck));
    }
  }, [neck, dispatch]);

  const bg = theme === Theme.Dark ? "bg-gray-600" : "bg-gray-200";
  const color = theme === Theme.Dark ? "white" : "black";
  const textStyle: StyleProp<TextStyle> = { fontSize: 14, color };
  return (
    <>
      <View
        style={[
          tw`max-w-full max-h-full z-10 top-3 left-3 flex flex-row gap-2 items-center`,
          {
            overflow: "auto",
            position: "fixed",
          },
        ]}
      >
        <ScaleSelector bg={bg} textStyle={textStyle} />
        <IconButton
          bg={bg}
          icon="⚙️"
          onPress={() => dispatch(setSettingsExpanded(!settingsExpanded))}
        />
        <IconButton
          bg={bg}
          icon="🎶"
          onPress={() => {
            if (switchToChromaticScale && !chordsExpanded) {
              dispatch(setSelectedScaleGroup("Rare"));
              dispatch(setSelectedScale("Chromatic (All notes)"));
            }
            dispatch(setChordsExpanded(!chordsExpanded));
          }}
        />
        {neck && <PlayButton bg={bg} />}
      </View>
      {settingsExpanded && <SettingsView bg={bg} textStyle={textStyle} />}
      {chordsExpanded && <ChordsView bg={bg} />}
    </>
  );
};
