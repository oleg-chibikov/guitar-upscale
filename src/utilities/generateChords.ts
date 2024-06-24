import { generateNeck } from "@/app/store/settingsSlice";

type Chord = {
  name: string;
  triad: number[];
  extension: number;
  bassNote: number;
  intervals: number[];
};

const triads = [
  { name: "major", intervals: [0, 4, 7], prefix: "" },
  { name: "minor", intervals: [0, 3, 7], prefix: "m" },
  { name: "diminished", intervals: [0, 3, 6], prefix: "dim" },
  { name: "augmented", intervals: [0, 4, 8], prefix: "aug" },
  { name: "sus2", intervals: [0, 2, 7], prefix: "sus2" },
  { name: "sus4", intervals: [0, 5, 7], prefix: "sus4" },
  { name: "5", intervals: [0, 7], prefix: "5" }, // Power chord has only root and perfect fifth
];

const extensions = [
  { name: "", intervals: [] },
  { name: "7", intervals: [10] },
  { name: "maj7", intervals: [11] },
  { name: "m7", intervals: [10] },
  { name: "6", intervals: [9] },
  { name: "9", intervals: [2] },
  { name: "11", intervals: [5] },
  { name: "13", intervals: [9] },
];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function generateChords(stringCount: number): Chord[] {
  const chords: Chord[] = [];

  triads.forEach((triad) => {
    const triadNotes = triad.intervals;

    extensions.forEach((extension) => {
      const chordIntervals = [...triad.intervals, ...extension.intervals];

      // Generate all possible combinations of intervals on the given number of strings
      for (let i = 0; i < stringCount; i++) {
        const chordVoicing: number[] = [];
        for (const interval of chordIntervals) {
          chordVoicing.push(mod(interval + i, 12));
        }

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
      }
    });
  });

  return chords;
}

// Example usage:
// const stringCount = 6;
// const generatedChords = generateChords(stringCount);
// console.log(generatedChords);

const neck = generateNeck();
