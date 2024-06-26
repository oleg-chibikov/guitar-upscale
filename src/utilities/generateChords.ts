import { NOTE_COUNT, Note, StringOctaveNote } from "@/app/data/notes";
import { CHROMATIC, SPECIAL, getScalePattern } from "@/app/data/scales";
import { getShiftedNote, parseStringToNotes } from "@/app/data/tunings";
import { generateNeckRepresentation } from "@/app/engine/generateNeckRepresentation";
import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";

type ChordStructure = {
  name: string;
  intervals: number[];
  prefix: string;
};

type ChordExtensionStructure = {
  name: string;
  addedInterval?: number;
  prefix: string;
};

// TODO: Perfect fifth can be omitted when having extensions!
// add CanOmitPerfectFifth to the ChordStructure below and use it when building the chord

const triads: ChordStructure[] = [
  { name: "Major", intervals: [0, 4, 7], prefix: "" },
  { name: "Minor", intervals: [0, 3, 7], prefix: "m" },
  { name: "Diminished", intervals: [0, 3, 6], prefix: "dim" },
  { name: "Augmented", intervals: [0, 4, 8], prefix: "aug" },
  { name: "Sustained 2", intervals: [0, 2, 7], prefix: "sus2" },
  { name: "Sustained 4", intervals: [0, 5, 7], prefix: "sus4" },
  { name: "Power", intervals: [0, 7], prefix: "5" }, // Power chord has only root and perfect fifth
];

const sixthExtensions: ChordExtensionStructure[] = [
  { name: "", prefix: "" },
  { name: "Sixth", addedInterval: 9, prefix: "6" },
  { name: "Minor Sixth", addedInterval: 8, prefix: "m6" },
];

const seventhExtensions: ChordExtensionStructure[] = [
  { name: "", prefix: "" },
  { name: "Major Seventh", addedInterval: 11, prefix: "maj7" },
  { name: "Minor / Dominant Seventh", addedInterval: 10, prefix: "7" },
];

const ninthExtensions: ChordExtensionStructure[] = [
  { name: "", prefix: "" },
  { name: "Ninth", addedInterval: 14, prefix: "9" },
  { name: "Flat Ninth", addedInterval: 13, prefix: "b9" },
  { name: "Sharp Ninth", addedInterval: 15, prefix: "#9" },
];

const eleventhExtensions: ChordExtensionStructure[] = [
  { name: "", prefix: "" },
  { name: "Eleventh", addedInterval: 17, prefix: "11" },
  { name: "Flat Eleventh", addedInterval: 16, prefix: "b11" },
  { name: "Sharp Eleventh", addedInterval: 18, prefix: "#11" },
];

const thirteensExtensions: ChordExtensionStructure[] = [
  { name: "", prefix: "" },
  { name: "Thirteens", addedInterval: 21, prefix: "13" },
  { name: "Flat Thirteens", addedInterval: 20, prefix: "b13" },
  { name: "Sharp Thirteens", addedInterval: 22, prefix: "#13" },
];

const capo = 0;
const MAX_DISTANCE_IN_CHORD = 4;

const scalePattern = getScalePattern(SPECIAL, CHROMATIC); // all scales include 0, so it's omitted from the scales themselves
const tuning = "EBGDAE";

const baseNote = Note.E;
const neck = generateNeckRepresentation(
  scalePattern,
  parseStringToNotes(tuning),
  getShiftedNote(baseNote, tuning),
  baseNote
);

type FingerPosition = StringOctaveNote | undefined;

type UltimateChordInfoVariation = {
  name: string;
  triad: ChordStructure;
  extensions: ChordExtensionStructure[];
  bassNote: StringOctaveNote;
  fingerPositions: FingerPosition[];
  fingerPositionsString: string;
};

type ChordBuilderInfo = {
  variation: FingerPosition[];
  minAllowedFretIndex?: number;
  maxAllowedFretIndex?: number;
};

const getFretLimitsForTheFirstTime = (
  fretIndex: number,
  absoluteMaxFretIndex: number
) => {
  const newMin = Math.max(capo + 1, fretIndex - MAX_DISTANCE_IN_CHORD);

  const newMax = Math.min(
    absoluteMaxFretIndex,
    fretIndex + MAX_DISTANCE_IN_CHORD
  );
  return { newMin, newMax };
};

const getChordName = (
  triad: ChordStructure,
  extensions: ChordExtensionStructure[],
  slashNote: Note,
  rootNote: Note
) =>
  `${Note[rootNote]}${triad.prefix}${extensions
    .map((x) => x.prefix)
    .join("add")}${rootNote === slashNote ? "" : `/${Note[slashNote]}`}`;

const findChordNotesRecursive = (
  stringIndex: number,
  allNotesInChord: Set<Note>, // all the notes that should participate in chord
  chordBuilder: (StringOctaveNote | undefined)[], // recursively populated array with finger positions
  usedNotesSet: Set<Note>, // recursively populated set with used notes
  minAllowedFretIndex?: number,
  maxAllowedFretIndex?: number
): ChordBuilderInfo[] => {
  const currentString = neck[stringIndex];
  const absoluteMaxFretIndex = neck[stringIndex].length - 1; // last fret on guitar

  const matchingNotesOnThisString: FingerPosition[] = []; // these are the positions of the chord notes on the current string
  // Always take the open note into account
  const openStringNote = currentString[capo];
  if (openStringNote !== null && allNotesInChord.has(openStringNote.note)) {
    matchingNotesOnThisString.push(openStringNote);
  }

  for (
    let j = minAllowedFretIndex ?? capo + 1;
    j <= (maxAllowedFretIndex ?? absoluteMaxFretIndex);
    j++
  ) {
    const nonOpenStringNote = neck[stringIndex][j];
    if (
      nonOpenStringNote !== null &&
      allNotesInChord.has(nonOpenStringNote.note)
    ) {
      matchingNotesOnThisString.push(nonOpenStringNote);
    }
  }

  matchingNotesOnThisString.push(undefined); // try muting this string (no note on the string)

  return matchingNotesOnThisString
    .flatMap((stringOctaveNote) => {
      const chordBuilderCopy = [...chordBuilder];
      chordBuilderCopy[stringIndex] = stringOctaveNote;
      const usedNotesSetCopy = new Set(usedNotesSet);
      // limits for the next string
      let newMin: number | undefined;
      let newMax: number | undefined;

      if (stringOctaveNote !== undefined) {
        usedNotesSetCopy.add(stringOctaveNote.note);
        // calculate possible range for the next string
        const fret = stringOctaveNote.fret;

        if (
          minAllowedFretIndex === undefined ||
          maxAllowedFretIndex === undefined
        ) {
          // limits are not set yet (open notes were used on all the previous strings)

          if (fret > capo) {
            // we use a fret on non open string and need to adjust the limits for the next string
            ({ newMin, newMax } = getFretLimitsForTheFirstTime(
              fret,
              absoluteMaxFretIndex
            ));
          }
          // else they are left undefined
        } else if (fret === capo) {
          // leave limits intact
          newMin = minAllowedFretIndex;
          newMax = maxAllowedFretIndex;
        } else {
          // adjust according to the current note

          // we can allow max MAX_DISTANCE_IN_CHORD frets in any direction. If we go left from the note on the next string - then the max limit should be recalculated from the leftmost position and vice versa for the right direction
          const rightMostUsedFret = Math.max(fret, maxAllowedFretIndex);
          const leftMostUsedFret = Math.min(fret, minAllowedFretIndex);

          newMin = rightMostUsedFret - MAX_DISTANCE_IN_CHORD;
          newMax = leftMostUsedFret + MAX_DISTANCE_IN_CHORD;
        }
      } else {
        // this is a muted string
        // leave limits intact
        newMin = minAllowedFretIndex;
        newMax = maxAllowedFretIndex;
      }

      if (stringIndex > 0) {
        return findChordNotesRecursive(
          stringIndex - 1,
          allNotesInChord,
          chordBuilderCopy,
          usedNotesSetCopy,
          newMin,
          newMax
        );
      }
      // this branch returns the final result
      const requiredNotesArray = Array.from(allNotesInChord);
      for (const requiredNote of requiredNotesArray) {
        if (!usedNotesSetCopy.has(requiredNote)) {
          return null;
        }
      }
      return [
        {
          variation: chordBuilderCopy,
          minAllowedFretIndex: newMin,
          maxAllowedFretIndex: newMax,
        },
      ];
    })
    .filter((x) => x) as ChordBuilderInfo[]; // exclude incomplete chords;
};

const allChords = new Map<string, UltimateChordInfoVariation[]>();
triads.forEach((triad) => {
  sixthExtensions.forEach((sixthExtension) => {
    seventhExtensions.forEach((seventhExtension) => {
      ninthExtensions.forEach((ninthExtension) => {
        eleventhExtensions.forEach((eleventhExtension) => {
          thirteensExtensions.forEach((thirteensExtension) => {
            const extensions = [
              sixthExtension,
              seventhExtension,
              ninthExtension,
              eleventhExtension,
              thirteensExtension,
            ].filter((x) => x.addedInterval !== undefined);

            const chordIntervals = [
              ...triad.intervals,
              ...(extensions.map((x) => x.addedInterval) as number[]),
            ];

            if (chordIntervals.length > neck.length) {
              // cannot build this chord on the given guitar - it has more notes that the strings guitar has
              return;
            }

            for (
              let stringIndex = tuning.length - 1; // starting from the lowest (thickest) string
              stringIndex >= chordIntervals.length;
              stringIndex--
            ) {
              const neckString = neck[stringIndex];
              const absoluteMaxFretIndex = neckString.length - 1;
              // loop through the strings starting from the lowest, ensuring there are strings to put all the notes of the chordIntervals
              for (
                let fretIndex = capo;
                fretIndex < absoluteMaxFretIndex;
                fretIndex++
              ) {
                const currentStringOctaveNote = neckString[fretIndex];
                if (currentStringOctaveNote === null) {
                  continue;
                }

                const getUltimateChord = (
                  bassNote: StringOctaveNote,
                  fingerPositions: FingerPosition[]
                ): UltimateChordInfoVariation => {
                  const fingerPositionsString = fingerPositions
                    .reverse()
                    .map((x) => x?.fret ?? "x")
                    .join(",");
                  return {
                    bassNote,
                    extensions,
                    triad,
                    fingerPositions,
                    fingerPositionsString,
                    name: getChordName(
                      triad,
                      extensions,
                      bassNote.note,
                      currentStringOctaveNote.note
                    ),
                  };
                };

                const notesInChord: Set<Note> = new Set(
                  chordIntervals.map(
                    (x) => (currentStringOctaveNote.note + x) % NOTE_COUNT
                  )
                );
                // console.log("Processing", currentStringOctaveNote);
                const chordBuilder: FingerPosition[] = [...Array(neck.length)];
                chordBuilder[currentStringOctaveNote.string] =
                  currentStringOctaveNote;
                const usedNotesSet = new Set<Note>();
                usedNotesSet.add(currentStringOctaveNote.note);

                // fret limits for the first
                let newMin: number | undefined;
                let newMax: number | undefined;

                if (fretIndex !== capo) {
                  // if we are not on the open string - then we can use only the adjacent several frets in each direction
                  ({ newMin, newMax } = getFretLimitsForTheFirstTime(
                    fretIndex,
                    absoluteMaxFretIndex
                  ));
                }
                // otherwise we are on the open string then we can use any fret for the next note

                // for each note and chord mode we build the realistic finger positions
                const realisticChordFingerPositions = findChordNotesRecursive(
                  stringIndex - 1,
                  notesInChord,
                  chordBuilder,
                  usedNotesSet,
                  newMin,
                  newMax
                );

                // finally we take the baseFretIndex and within the reasonable reach we change the first note of the chord with a different note - this way we get a slash chord
                // slash chords are variations of a chord with different bass note
                for (const variationInfo of realisticChordFingerPositions) {
                  const minAllowedFretIndex =
                    variationInfo.minAllowedFretIndex ?? capo + 1;
                  const maxAllowedFretIndex =
                    variationInfo.maxAllowedFretIndex ?? absoluteMaxFretIndex;
                  // get the variation of chord with open string;

                  const openStringNote = neckString[capo];
                  if (openStringNote !== null) {
                    const openStringSlashChord = [...variationInfo.variation];

                    openStringSlashChord[openStringNote.string] =
                      openStringNote; // prepend open string note
                    const chordInfo = getUltimateChord(
                      openStringNote,
                      openStringSlashChord
                    );
                    addOrUpdateMapArray(allChords, chordInfo.name, chordInfo);
                  }

                  for (
                    let fretIndex = minAllowedFretIndex;
                    fretIndex <= maxAllowedFretIndex;
                    fretIndex++
                  ) {
                    const slashChord = [...variationInfo.variation];
                    const noteAtFret = neckString[fretIndex];
                    if (noteAtFret !== null) {
                      slashChord[noteAtFret.string] = noteAtFret; // prepend current note that is within finger reach defined by the chord
                      const chordInfo = getUltimateChord(
                        noteAtFret,
                        slashChord
                      );
                      addOrUpdateMapArray(allChords, chordInfo.name, chordInfo);
                    }
                  }
                }
              }
            }
            // Generate all possible combinations of intervals on the given number of strings

            // for each note on the fret (only on the strings lower than the length of the intervals - for example if there are 4 intervals - no need to try building this chord from the 3rd strings - we need at least 4)
            // recursively go for each higher string:
            // get all the notes matching all the given intervals on the next string including Muting that string.
            // check if they are within the reach from the first note (if it wasn't open) - set the startingFret only when taking the first non-open string
            // if the note is within reach - do the same on the higher string.
            // after all is done - leave only the chords which have all the notes from the interval (each of them should be at least once). the rest are incomplete.
            // slash chords - for each of variations shift the bass note - it can be open string or it should be within the reach of the startingFret

            // build that for each note

            // chords.push({
            //   name: `${triad.prefix}${extension.name}`,
            //   triad,
            //   extension
            //   intervals: chordVoicing,
            // });
          });
        });
      });
    });
  });
});

console.log("done");
// console.log(
//   Array.from(allChords.entries()).map(
//     ([key, value]) =>
//       `${key}: ${value.map((x) => x.fingerPositionsString).join(" | ")}`
//   )
// );

// Example usage:
// const stringCount = 6;
// const generatedChords = generateChords(stringCount);
// console.log(generatedChords);
