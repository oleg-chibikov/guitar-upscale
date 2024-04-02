import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, ScaledSize, View } from "react-native";
import { Note, stringTuning } from "../data/notes";
import { scalesMap } from "../data/scales";
import { ShowNoteMode } from "../data/showNoteMode";
import { generateNeckRepresentation } from "../engine/generateNeckRepresentation";
import tw from "../tailwind";
import { ControlPanel } from "./ControlPanel";
import { Fretboard } from "./Fretboard";

// TODO
// More scales
// Scales by category - classical, expitic, major, minor, japanese, arabic, gypsy. several levels of nesting
// dark/light
// youtube videos for each scale
// get the formula to avoid hardcoding each string
// highlight notes when playing/autoplay
// redux
// more instruments + dropdown
// menu layout
// zoom with pinch

export const Main: React.FC = () => {
  const [selectedScale, setSelectedScale] = useState<string>(
    scalesMap.keys().next().value
  );
  const [selectedBaseNote, setSelectedBaseNote] = useState<Note>(Note.E);
  const [selectedShowNoteMode, setSelectedShowNoteMode] =
    useState<ShowNoteMode>(ShowNoteMode.Note);
  useEffect(() => {
    console.log(selectedBaseNote);
    console.log(selectedScale);
  }, [selectedBaseNote, selectedScale]);

  const [highResLoaded, setHighResLoaded] = useState(false);

  const neck = useMemo(() => {
    const scalePattern = new Set(scalesMap.get(selectedScale));
    return generateNeckRepresentation(
      scalePattern,
      stringTuning,
      selectedBaseNote
    );
  }, [selectedBaseNote, selectedScale, stringTuning]);

  if (!neck) {
    return "Loading...";
  }

  const [scaleFactor, setScaleFactor] = useState(1);

  const recalculateScaleFactor = (size: ScaledSize) => {
    const isLandscape = size.width > size.height;
    const baseScale = 0.5;

    const scaleFactor =
      baseScale +
      (isLandscape
        ? Math.log10(size.width / size.height)
        : Math.log(size.height / size.width));
    setScaleFactor(scaleFactor * size.fontScale);
  };

  useEffect(() => {
    Dimensions.addEventListener("change", (e) =>
      // TODO: Debounce
      recalculateScaleFactor(e.window)
    );
    recalculateScaleFactor(Dimensions.get("window"));
  }, []);

  return (
    <>
      <ControlPanel
        selectedScale={selectedScale}
        setSelectedScale={(x) => {
          //   setIsPlaying(false);
          setSelectedScale(x);
        }}
        selectedBaseNote={selectedBaseNote}
        setSelectedBaseNote={(x) => {
          //     setIsPlaying(false);
          setSelectedBaseNote(x);
        }}
        selectedShowNoteMode={selectedShowNoteMode}
        setSelectedShowNoteMode={setSelectedShowNoteMode}
        neck={neck}
      />
      <View
        style={[
          tw`overflow-hidden w-full h-full items-start justify-center bg-white`,
          { minWidth: 2300 * scaleFactor },
        ]}
      >
        {!highResLoaded && (
          <Fretboard
            showNoteMode={selectedShowNoteMode}
            scaleFactor={scaleFactor}
            imageSource={require("./assets/guitar_low.png")}
            neck={neck}
            baseNote={selectedBaseNote}
          />
        )}

        <Fretboard
          showNoteMode={selectedShowNoteMode}
          scaleFactor={scaleFactor}
          imageSource={require("./assets/guitar.png")}
          neck={neck}
          onImageLoaded={() => {
            console.log("Loaded full res image");
            setHighResLoaded(true);
          }}
          isCollapsed={!highResLoaded}
          baseNote={selectedBaseNote}
        />
      </View>
    </>
  );
};
