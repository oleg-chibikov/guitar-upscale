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

  const totalRows = chords.length;
  const totalColumns = chords[0].modes.filter((x) =>
    useAdvancedChords
      ? true
      : x.mode === ChordMode.Major || x.mode === ChordMode.Minor
  ).length;

  return (
    <section
      className={`opacity-95 overflow-auto fixed ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left" : "right"
      }-1 z-20 bottom-1 ${bg} p-1 gap-1 ${
        !hasTouchInput ? "grid-cols-2" : "grid-rows-2"
      }`}
      style={{
        maxWidth: hasTouchInput && height < 700 ? 150 : "100vw", // when height is 700+ there's enough space under the guitar to show full chords
        maxHeight: hasTouchInput ? "95vh" : 450,
        display: "grid",
        gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
        gridTemplateRows: `repeat(${totalRows}, 1fr)`,
      }}
    >
      {chords.flatMap((noteChord) =>
        noteChord.modes.map((noteChordMode) => {
          const isHidden =
            !useAdvancedChords &&
            noteChordMode.mode !== ChordMode.Major &&
            noteChordMode.mode !== ChordMode.Minor;

          const title =
            getNoteText(noteChord.note) + getModeText(noteChordMode.mode);

          return (
            <ChordButton
              key={title}
              isHidden={isHidden}
              noteChordMode={noteChordMode}
              chordName={title}
            />
          );
        })
      )}
    </section>
  );
};
