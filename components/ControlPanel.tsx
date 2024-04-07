import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { PlayButton } from "./PlayButton";

import { stringTuning } from "../data/notes";
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
  setSettingsExpanded,
} from "../store/controlPanelSlice";
import tw from "../tailwind";
import BaseNoteSelector from "./BaseNoteSelector";
import IconButton from "./IconButton";
import NoteDisplayModeSelector from "./NoteDisplayModeSelector";
import PlayIntervalSlider from "./PlayIntervalSlider";
import PlaybackTypeSelector from "./PlaybackTypeSelector";
import ScaleSelector from "./ScaleSelector";
import ThemeSelector from "./ThemeSelector";
import VelocitySlider from "./VelocitySlider";

const ControlPanel: React.FC = () => {
  const {
    selectedScale,
    selectedScaleGroup,
    selectedBaseNote,
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

  return (
    <>
      <View
        style={[
          tw`z-10 top-3 left-3 flex flex-row gap-2 items-center`,
          { position: "fixed" },
        ]}
      >
        <ScaleSelector />
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
          <Text style={tw`text-md`}>Theme:</Text>
          <ThemeSelector />
          <Text style={tw`text-md`}>Base Note:</Text>
          <BaseNoteSelector />
          <Text style={tw`text-md`}>Note Display Mode:</Text>
          <NoteDisplayModeSelector />
          <Text style={tw`text-md`}>Playback type:</Text>
          <PlaybackTypeSelector />
          <Text style={tw`text-md`}>Playback speed:</Text>
          <PlayIntervalSlider />
          <Text style={tw`text-md`}>Playback volume:</Text>
          <VelocitySlider />
        </View>
      )}
    </>
  );
};

export default ControlPanel;
