import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { getNoteText } from "../../data/notes";

import { ChordMode, getModeText } from "../../engine/chordsGenerator";
import { useInputChecker } from "../../helpers/useInputChecker";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { ChordButton } from "./ChordButton";

export const ChordsView: React.FC = () => {
  const { neck, useAdvancedChords, chords, bg } =
    useSelector(selectControlPanel);

    const [height, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // it's ergonomic to display chords vertically for touch devices in order to play with right hand
  const hasTouchInput = useInputChecker();
  const { chordsExpanded, chordsDisplayMode } = useSelector(selectControlPanel);

  if (!chordsExpanded || !neck || !chords) {
    return null;
  }

  return (
    <div
  className={`opacity-95 overflow-auto fixed ${chordsDisplayMode === ChordsDisplayMode.Left ? "left" : "right"}-1 z-20 bottom-1 ${bg} p-1 gap-1 flex ${!hasTouchInput ? "flex-row" : "flex-col"}`}
  style={{
    maxWidth: hasTouchInput && height < 700 ? 150 : "95%", // when height is 700+ there's enough space under the guitar to show full chords
    maxHeight: hasTouchInput ? "95%" : 350,
  }}
>
      {chords.map((noteChord) => (
        <div
          key={noteChord.note}
          className={`gap-1 flex justify-between ${!hasTouchInput ? "flex-col" : "flex-row"}`}
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
        </div>
      ))}
    </div>
  );
};
