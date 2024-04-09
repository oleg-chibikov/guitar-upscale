import { memo, useEffect, useRef } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { ChordPlayMode } from "../../data/chordPlayMode";
import { ChordsMap } from "../../data/chords";
import { StringOctaveNote, getNoteText } from "../../data/notes";
import { NotePlayEventBus } from "../../engine/eventBus";
import {
  ChordMode,
  NoteChordMode,
  generateAllChords,
  getModeText,
} from "../../engine/generateChords";
import { sleep } from "../../engine/sleep";
import {
  calculateAverage,
  findObjectWithMinValue,
} from "../../helpers/arrayHelper";
import { selectControlPanel, setChords } from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { ChordButton } from "./ChordButton";

export const ChordsView: React.FC = memo(() => {
  const {
    neck,
    useAdvancedChords,
    chords,
    bg,
    chordStrummingDelayMs,
    chordPlayMode,
  } = useSelector(selectControlPanel);

  const { chordsExpanded } = useSelector(selectControlPanel);
  const chordRoundRobinMap = useRef(new Map<string, number>()).current;
  const dispatch = useDispatch();

  useEffect(() => {
    if (!neck) {
      return;
    }

    const chordsForNeck = generateAllChords(neck);
    dispatch(setChords(chordsForNeck));
  }, [neck]);

  if (!chordsExpanded || !neck || !chords) {
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

  const selectRandomVariation = (variations: StringOctaveNote[][]) => {
    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex];
  };

  const playVariation = async (variation: StringOctaveNote[]) => {
    for (const note of variation) {
      NotePlayEventBus.next(note);
      await sleep(chordStrummingDelayMs);
    }
  };

  const playRandomChordVariation = async (mode: NoteChordMode) => {
    const randomVariation = selectRandomVariation(mode.variations);
    await playVariation(randomVariation);
  };

  const playFirstChordVariation = async (mode: NoteChordMode) => {
    const randomVariation = mode.variations[0];
    await playVariation(randomVariation);
  };

  const playClosestChordVariation = async (mode: NoteChordMode) => {
    const variationAvgDistances = mode.variations.map((variation) => {
      const distances = variation.map((note) => note.fret);
      const avgDistance = calculateAverage(distances);
      return { object: variation, number: avgDistance };
    });
    const variation = findObjectWithMinValue(variationAvgDistances);

    await playVariation(variation);
  };

  const playAllVariations = async (mode: NoteChordMode) => {
    for (const variation of mode.variations) {
      await playVariation(variation);
      await sleep(1000);
    }
  };

  const playRoundRobin = async (title: string, mode: NoteChordMode) => {
    let currentVariation = chordRoundRobinMap.get(title);
    if (currentVariation === undefined) {
      currentVariation = 0;
    } else {
      currentVariation++;
      if (currentVariation >= mode.variations.length) {
        currentVariation = 0;
      }
    }
    await playVariation(mode.variations[currentVariation]);
    chordRoundRobinMap.set(title, currentVariation);
  };

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
      {chords.map((noteChord) => (
        <View
          key={noteChord.note}
          style={[
            tw`gap-1 flex ${useAdvancedChords ? "flex-row" : "flex-col"}`,
            { justifyContent: "space-between" },
          ]}
        >
          {noteChord.modes.map((mode) => {
            if (
              !useAdvancedChords &&
              mode.mode !== ChordMode.Major &&
              mode.mode !== ChordMode.Minor
            ) {
              return null;
            }

            const title = getNoteText(noteChord.note) + getModeText(mode.mode);

            return (
              <ChordButton
                disabled={!mode.variations.length}
                chordName={title}
                key={title}
                onPress={async () => {
                  switch (chordPlayMode) {
                    case ChordPlayMode.RoundRobin:
                      await playRoundRobin(title, mode);
                      return;
                    case ChordPlayMode.AllVariations:
                      return await playAllVariations(mode);
                    case ChordPlayMode.FirstVariation:
                      return await playFirstChordVariation(mode);
                    case ChordPlayMode.ClosestVariation:
                      return await playClosestChordVariation(mode);
                    case ChordPlayMode.RandomVariation:
                      return await playRandomChordVariation(mode);
                  }
                }}
              ></ChordButton>
            );
          })}
        </View>
      ))}

      {/* {Object.entries(chordRows).map(([letter, chords]) => (
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
      ))} */}
    </View>
  );
});
