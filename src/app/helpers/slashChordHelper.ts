import { MAX_DISTANCE_IN_CHORD } from "@/app/data/chordsGeneratorTypes";
import { Chord, FRET_COUNT, StringOctaveNote } from "@/app/data/notes";

export function getPossibleFretRangeForChord(
  chordVariation: Chord,
  capo: number,
) {
  const chordFrets = chordVariation
    .filter((fp): fp is StringOctaveNote => fp !== undefined)
    .map((fp) => fp.fret);
  const minChordFret = Math.min(...chordFrets);
  const maxChordFret = Math.max(...chordFrets);
  // Calculate allowed fret range for this string
  const minAllowedFretIndex = Math.max(
    capo + 1,
    maxChordFret - MAX_DISTANCE_IN_CHORD,
  );
  const maxAllowedFretIndex = Math.min(
    FRET_COUNT - 1,
    minChordFret + MAX_DISTANCE_IN_CHORD,
  );
  return { minAllowedFretIndex, maxAllowedFretIndex };
}
