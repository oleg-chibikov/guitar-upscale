import { memo, useRef } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { ChordPlayMode } from "../../data/chordPlayMode";
import { StringOctaveNote, getNoteText } from "../../data/notes";
import { NotePlayEventBus } from "../../engine/eventBus";
import {
  ChordMode,
  NoteChordMode,
  getModeText,
} from "../../engine/generateChords";
import { sleep } from "../../engine/sleep";
import {
  calculateAverage,
  findObjectWithMinValue,
} from "../../helpers/arrayHelper";
import { selectControlPanel } from "../../store/controlPanelSlice";
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

  if (!chordsExpanded || !neck || !chords) {
    return null;
  }

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
        tw`opacity-95 right-1 z-20 bottom-1 ${bg} p-1 gap-1 flex flex-row`,
        {
          overflow: "auto",
          position: "fixed",
          maxWidth: "95%",
          maxHeight: "95%",
        },
      ]}
    >
      {chords.map((noteChord) => (
        <View
          key={noteChord.note}
          style={[tw`gap-1 flex flex-col`, { justifyContent: "space-between" }]}
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
    </View>
  );
});
