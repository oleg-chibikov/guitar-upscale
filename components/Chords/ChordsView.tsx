import { memo, useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { useSelector } from "react-redux";
import { ChordPlayMode } from "../../data/chordPlayMode";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { Chord, getNoteText } from "../../data/notes";
import { NotePlayEventBus } from "../../engine/eventBus";

import {
  ChordMode,
  NoteChordMode,
  getClosestVariation,
  getModeText,
} from "../../engine/chordsGenerator";
import { sleep } from "../../engine/sleep";
import { useInputChecker } from "../../helpers/useInputChecker";
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
  const { chordsExpanded, selectedChordsDisplayMode } =
    useSelector(selectControlPanel);
  const chordRoundRobinMap = useRef(new Map<string, number>()).current;

  if (!chordsExpanded || !neck || !chords) {
    return null;
  }

  const selectRandomVariation = (variations: Chord[]) => {
    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex];
  };

  const playVariation = async (variation: Chord) => {
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
    const closestVariation = getClosestVariation(mode);
    if (closestVariation) {
      await playVariation(closestVariation);
    }
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
        tw`opacity-95 ${
          selectedChordsDisplayMode === ChordsDisplayMode.Left
            ? "left"
            : "right"
        }-1 z-20 bottom-1 ${bg} p-1 gap-1 flex ${
          !hasTouchInput ? "flex-row" : "flex-col"
        }`,
        {
          overflow: "auto",
          position: "fixed",
          maxWidth: height < 700 ? 200 : "95%", // when height is 700+ there's enough space under the guitar to show full chords
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
