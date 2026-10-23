import { THUMB } from "@/app/data/chordFingerConstants";
import { ChordBuilderInfo, ChordVariations } from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { StringOctaveNote } from "@/app/data/notes";
import { calculateAverage } from "@/app/helpers/arrayHelper";

type StringPreference = "high" | "low";

export const getPreferredChordVariation = (
  chordVariations: ChordVariations,
  stringPreference: StringPreference = "high",
  numberOfStrings: number,
  type: ChordPlayMode
): ChordBuilderInfo => {
  switch (type) {
    case ChordPlayMode.Barre:
      return getBestOf(
        chordVariations.filter(isBarreChord),
        stringPreference,
        numberOfStrings
      );
    case ChordPlayMode.With_Thumb:
      return getBestOf(
        chordVariations.filter(
          (x) => x.fingerAssignment[x.fingerAssignment.length - 1] === THUMB
        ),
        stringPreference,
        numberOfStrings
      );
    case ChordPlayMode.Preferred_Variation_With_Min_Notes:
      return getPreferredChordVariationWithMinNotes(
        chordVariations,
        stringPreference,
        numberOfStrings
      );
    case ChordPlayMode.Preferred_Variation_With_Max_Notes:
      return getPreferredChordVariationWithMaxNotes(
        chordVariations,
        stringPreference,
        numberOfStrings
      );
    case ChordPlayMode.Preferred_Variation:
      return getGeneralPreferredChordVariation(
        chordVariations,
        stringPreference,
        numberOfStrings
      );
    default:
      return chordVariations[0];
  }
};

const getGeneralPreferredChordVariation = (
  chordVariations: ChordVariations,
  stringPreference: StringPreference = "high",
  numberOfStrings: number
): ChordBuilderInfo => {
  const calculateVariationScore = (variation: ChordBuilderInfo): number => {
    const playedNotes = variation.variation.filter(
      (note): note is StringOctaveNote => note !== undefined
    );

    if (playedNotes.length === 0) return Infinity; // Penalize empty variations

    const avgFret = calculateAverage(playedNotes.map((note) => note.fret));
    const lowestFret = Math.min(...playedNotes.map((note) => note.fret));
    const highestFret = Math.max(...playedNotes.map((note) => note.fret));
    const spread = highestFret - lowestFret;

    // Factors to consider (lower score is better):
    // 1. Prefer chords with more strings, but don't overly penalize 4-string variations like in D
    const stringCountScore =
      Math.max(0, numberOfStrings - playedNotes.length) *
      (stringPreference === "low" ? 5 : 0.7); // this is very impactful for for the 'low' mode

    // 2. Prefer lower positions on the fretboard
    const positionScore = avgFret * 0.5;

    // 3. Prefer more compact chords, but allow some spread for playability
    const spreadScore = Math.max(0, spread - 3) * 0.5;

    // 4. Penalize variations with large jumps between adjacent played strings
    const jumpScore = playedNotes.slice(1).reduce((score, note, index) => {
      const prevNote = playedNotes[index];
      return score + Math.max(0, Math.abs(note.fret - prevNote.fret) - 2) * 0.5;
    }, 0);

    // 5. Adjust score based on string preference
    const stringPreferenceScore =
      playedNotes.reduce((score, note) => {
        return (
          score +
          (stringPreference === "low"
            ? (numberOfStrings - note.string) * 5 // this is very impactful for for the 'low' mode
            : note.string) *
            0.1
        );
      }, 0) / playedNotes.length;

    // 6. Slight penalty for skipping strings in the middle
    const skippedStringsScore = variation.variation.reduce(
      (score, note, index, arr) => {
        if (
          note === undefined &&
          index > 0 &&
          index < arr.length - 1 &&
          arr[index - 1] !== undefined &&
          arr[index + 1] !== undefined
        ) {
          return score + 1;
        }
        return score;
      },
      0
    );

    // 7. Penalty for using the same note from the same octave
    const uniqueNotesScore = playedNotes.reduce((score, note, index, arr) => {
      const duplicates = arr
        .slice(index + 1)
        .filter(
          (otherNote) =>
            otherNote.note === note.note && otherNote.octave === note.octave
        );
      return score + duplicates.length * 1.5; // Adjust the multiplier as needed
    }, 0);

    return (
      stringCountScore +
      positionScore +
      spreadScore +
      jumpScore +
      stringPreferenceScore +
      skippedStringsScore +
      uniqueNotesScore
    );
  };

  // The fingering only decides between equal frets
  let best = chordVariations[0];
  let bestScore = calculateVariationScore(best);
  let bestFingeringScore = getFingeringScore(best);
  for (let i = 1; i < chordVariations.length; i++) {
    const current = chordVariations[i];
    const score = calculateVariationScore(current);
    if (score > bestScore) {
      continue;
    }
    const fingeringScore = getFingeringScore(current);
    if (score < bestScore || fingeringScore < bestFingeringScore) {
      best = current;
      bestScore = score;
      bestFingeringScore = fingeringScore;
    }
  }
  return best;
};

// The index finger frets the bass and lies across the higher strings, as in the E and A shapes
const isBarreChord = ({
  variation,
  fingerAssignment,
  hasBarreOnIndexFinger,
}: ChordBuilderInfo) => {
  if (!hasBarreOnIndexFinger) {
    return false;
  }
  for (let string = variation.length - 1; string >= 0; string--) {
    if (variation[string] !== undefined) {
      return fingerAssignment[string] === 0;
    }
  }
  return false;
};

const getBestOf = (
  chordVariations: ChordVariations,
  stringPreference: StringPreference,
  numberOfStrings: number
): ChordBuilderInfo =>
  chordVariations.length
    ? getGeneralPreferredChordVariation(
        chordVariations,
        stringPreference,
        numberOfStrings
      )
    : chordVariations[0];

const getFingeringScore = ({
  variation,
  fingerAssignment,
}: ChordBuilderInfo): number => {
  let score = 0;
  let firstFret = Infinity;
  for (let string = 0; string < variation.length; string++) {
    const finger = fingerAssignment[string];
    const fret = variation[string]?.fret;
    if (finger !== undefined && finger !== THUMB && fret !== undefined) {
      firstFret = Math.min(firstFret, fret);
    }
  }

  const stringCountByFinger = [0, 0, 0, 0];
  for (let string = 0; string < variation.length; string++) {
    const finger = fingerAssignment[string];
    const fret = variation[string]?.fret;
    if (finger === undefined || fret === undefined) {
      continue;
    }
    if (finger === THUMB) {
      score += 1;
      continue;
    }
    stringCountByFinger[finger]++;
    // One finger per fret. Reaching with a lower finger is harder than bunching up.
    const offset = fret - firstFret;
    score +=
      finger < offset ? (offset - finger) * 0.3 : (finger - offset) * 0.1;
  }

  // A barre takes effort, so the same frets without one win
  for (const count of stringCountByFinger) {
    if (count > 1) {
      score += 0.5;
    }
  }
  return score;
};

const getPreferredChordVariationWithMinNotes = (
  chordVariations: ChordVariations,
  stringPreference: StringPreference,
  numberOfStrings: number
) => {
  const minPlayedNotes = Math.min(
    ...chordVariations.map(
      (v) => v.variation.filter((note) => note !== undefined).length
    )
  );
  const variationsWithMinNotes = chordVariations.filter(
    (v) =>
      v.variation.filter((note) => note !== undefined).length === minPlayedNotes
  );
  return getGeneralPreferredChordVariation(
    variationsWithMinNotes,
    stringPreference,
    numberOfStrings
  );
};

const getPreferredChordVariationWithMaxNotes = (
  chordVariations: ChordVariations,
  stringPreference: StringPreference,
  numberOfStrings: number
) => {
  const maxPlayedNotes = Math.max(
    ...chordVariations.map(
      (v) => v.variation.filter((note) => note !== undefined).length
    )
  );
  const variationsWithMinNotes = chordVariations.filter(
    (v) =>
      v.variation.filter((note) => note !== undefined).length === maxPlayedNotes
  );
  return getGeneralPreferredChordVariation(
    variationsWithMinNotes,
    stringPreference,
    numberOfStrings
  );
};
