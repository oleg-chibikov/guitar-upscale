import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { stringTuning } from "../../data/notes";
import { getScaleNotes, scalesMap } from "../../data/scales";
import { generateAllChords } from "../../engine/generateChords";
import { generateNeckRepresentation } from "../../engine/generateNeckRepresentation";
import {
  selectControlPanel,
  setChords,
  setNeck,
} from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { ChordsView } from "../chords/ChordsView";
import { ScaleSelector } from "./ScaleSelector";
import { SettingsView } from "./SettingsView";
import { OpenChordsButton } from "./buttons/OpenChordsButton";
import { OpenSettingsButton } from "./buttons/OpenSettingsButton";
import { PlayButton } from "./buttons/PlayButton";

export const ControlPanel: React.FC = () => {
  const { selectedScale, selectedScaleGroup, selectedBaseNote } =
    useSelector(selectControlPanel);
  const dispatch = useDispatch();
  if (selectedBaseNote === null || !selectedScaleGroup || !selectedScale) {
    return null;
  }
  const { neck, chords } = useMemo(() => {
    // TODO: Check why debugger ends up in this method even when it should have memoized the neck
    const scaleObject = scalesMap.get(selectedScaleGroup)!.get(selectedScale);
    let scaleNotes = getScaleNotes(scaleObject);
    const scalePattern = new Set(scaleNotes?.concat([0]));

    // Just for debug
    // checkDuplicateScales(scalesMap);
    const generatedNeck = generateNeckRepresentation(
      scalePattern,
      stringTuning,
      selectedBaseNote
    );

    const chordsForNeck = generateAllChords(generatedNeck);

    return {
      neck: generatedNeck,
      chords: chordsForNeck,
    };
  }, [selectedBaseNote, selectedScale, selectedScaleGroup, stringTuning]);

  useEffect(() => {
    if (neck) {
      dispatch(setNeck(neck));
      dispatch(setChords(chords));
    }
  }, [neck, dispatch]);

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
        <ScaleSelector />
        <OpenSettingsButton />
        <OpenChordsButton />
        <PlayButton />
      </View>
      <SettingsView />
      <ChordsView />
    </>
  );
};
