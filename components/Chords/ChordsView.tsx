import { memo } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { ChordsMap } from "../../data/chords";
import { StringOctaveNote } from "../../data/notes";
import { NotePlayEventBus } from "../../engine/eventBus";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { ChordButton } from "./ChordButton";

export const ChordsView: React.FC<{ bg: string }> = memo(({ bg }) => {
  const { neck, useAdvancedChords, matchFullChord } =
    useSelector(selectControlPanel);

  if (!neck) {
    return null;
  }

  const chordRows: { [key: string]: string[] } = {};
  // Group chords by their starting letter
  Object.keys(ChordsMap).forEach((chordName) => {
    let startingLetter = chordName.charAt(0).toUpperCase();
    if (chordName.charAt(1) === "#") {
      startingLetter += "#";
    }

    if (!chordRows[startingLetter]) {
      chordRows[startingLetter] = [];
    }
    chordRows[startingLetter].push(chordName);
  });

  return (
    <View
      style={[
        tw`opacity-95 right-3 z-20 bottom-3 ${bg} p-1 gap-2`,
        tw`flex ${
          useAdvancedChords ? "flex-col" : "flex-row"
        } max-w-full max-h-full gap-1`,
        { overflow: "auto", position: "fixed" },
      ]}
    >
      {Object.entries(chordRows).map(([letter, chords]) => (
        <View
          key={letter}
          style={[
            tw`gap-1 flex ${useAdvancedChords ? "flex-row" : "flex-col"}`,
            { justifyContent: "space-between" },
          ]}
        >
          {chords.map((chordName) => {
            if (!useAdvancedChords && /6|dim|sus|7/.test(chordName)) {
              return null;
            }

            const chordNotesString = ChordsMap[chordName];
            let lastNoteIsInNeck = false;
            const notes = chordNotesString
              .split("")
              .map((char, string) => {
                const fret = parseInt(char);
                if (!isNaN(fret)) {
                  const note = neck[string][fret];
                  if (!note) {
                    lastNoteIsInNeck = false;
                    return undefined;
                  } else {
                    // we wanna track the lowest (base) note in the chord and see if it's in neck. If so - chord is applicable to the current scale
                    lastNoteIsInNeck = true;
                  }
                  return { ...note, string };
                }
                return undefined;
              })
              .filter((note) => note)
              .map((note) => note as StringOctaveNote);

            return (
              <ChordButton
                disabled={!lastNoteIsInNeck || !notes.length}
                key={chordName}
                chordName={chordName}
                onPress={() => {
                  notes.forEach((note) => {
                    NotePlayEventBus.next(note);
                  });
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});
