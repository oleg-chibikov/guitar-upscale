import { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { getNoteText } from "../../data/notes";

import { ChordMode, getModeText } from "../../engine/chordsGenerator";
import { useInputChecker } from "../../helpers/useInputChecker";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { ChordButton } from "./ChordButton";

export const ChordsView: React.FC = () => {
  const { neck, useAdvancedChords, chords, bg } =
    useSelector(selectControlPanel);

  const [height, setHeight] = useState(Dimensions.get("window").height);

  useEffect(() => {
    var handler = Dimensions.addEventListener("change", (e) => {
      // TODO: Debounce and use CSS media queries on web instead
      setHeight(e.window.height);
    });
    return () => handler.remove();
  }, []);

  // it's ergonomic to display chords vertically for touch devices in order to play with right hand
  const hasTouchInput = useInputChecker();
  const { chordsExpanded, chordsDisplayMode } = useSelector(selectControlPanel);

  if (!chordsExpanded || !neck || !chords) {
    return null;
  }

  return (
    <View
      style={[
        tw`opacity-95 ${
          chordsDisplayMode === ChordsDisplayMode.Left ? "left" : "right"
        }-1 z-20 bottom-1 ${bg} p-1 gap-1 flex ${
          !hasTouchInput ? "flex-row" : "flex-col"
        }`,
        {
          overflow: "auto",
          position: "fixed",
          maxWidth: hasTouchInput && height < 700 ? 150 : "95%", // when height is 700+ there's enough space under the guitar to show full chords
          maxHeight: "95%",
        },
      ]}
    >
      {chords.map((noteChord) => (
        <View
          key={noteChord.note}
          style={[
            tw`gap-1 flex  ${!hasTouchInput ? "flex-col" : "flex-row"}`,
            { justifyContent: "space-between" },
          ]}
        >
          {noteChord.modes.map((noteChordMode) => {
            if (
              !useAdvancedChords &&
              noteChordMode.mode !== ChordMode.Major &&
              noteChordMode.mode !== ChordMode.Minor
            ) {
              return null;
            }
            const title =
              getNoteText(noteChord.note) + getModeText(noteChordMode.mode);

            return (
              <ChordButton
                noteChordMode={noteChordMode}
                chordName={title}
                key={title}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};
