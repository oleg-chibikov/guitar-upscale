import { NOTE_COUNT, Note, OctaveNote } from "@/app/data/notes";

// TODO: Can we do that on a server side?

interface TuningData {
  name: string;
  shift?: number;
  octaveNotes: OctaveNote[];
}

type TuningType = "standard" | "drop" | "celtic" | "folk" | "cross" | "open";

export function generateAllTunings(): { [key: string]: TuningData } {
  const tunings: { [key: string]: TuningData } = {};
  const tuningTypes: TuningType[] = [
    "standard",
    "drop",
    "celtic",
    "folk",
    "cross", // allows to play minor chord on the open string
    "open", // allows to play major chord on the open string
  ];
  const stringCounts = [6, 7, 8];

  // Start from E (4) and go down to A (9)
  for (
    let rootNote: Note = Note.E, i = 0;
    i < NOTE_COUNT;
    rootNote = (rootNote - 1 + NOTE_COUNT) % NOTE_COUNT, i++
  ) {
    processRootNote(stringCounts, tuningTypes, rootNote, tunings);
  }

  return tunings;
}

function getStringOctaves(tuning: Note[], baseOctave: number): OctaveNote[] {
  let currentOctave = baseOctave;
  let previousNote = tuning[0];

  return tuning.map((note) => {
    if (note > previousNote) {
      currentOctave--;
    }

    previousNote = note;
    return { note, octave: currentOctave };
  });
}

function generateTuning(
  rootNote: Note,
  type: TuningType,
  stringCount: number = 6
): Note[] {
  let tuning: Note[] = [];

  const shift = (note: Note) =>
    (note + rootNote - Note.E + NOTE_COUNT) % NOTE_COUNT;

  // useful thread on the topic
  // https://www.reddit.com/r/ExtendedRangeGuitars/comments/fr2mox/hi_goys_any_suggestions_for_8_string_open_tunings/
  // Generate base tuning for 6 strings
  switch (type) {
    case "standard":
    case "drop":
      tuning = tuning.concat([
        shift(Note.E),
        shift(Note.B),
        shift(Note.G),
        shift(Note.D),
        shift(Note.A),
        shift(Note.E),
        shift(Note.B),
        shift(Note["F#"]),
      ]);
      break;
    case "celtic":
      tuning = tuning.concat([
        shift(Note.D),
        shift(Note.A),
        shift(Note.G),
        shift(Note.D),
        shift(Note.A),
        shift(Note.D),
        shift(Note.A),
        shift(Note.D),
      ]);
      break;
    case "folk":
      tuning = tuning.concat([
        shift(Note.D),
        shift(Note.A),
        shift(Note.D),
        shift(Note.D),
        shift(Note.A),
        shift(Note.D),
        shift(Note.B),
        shift(Note.D),
      ]);
      break;
    case "cross":
      tuning = tuning.concat([
        shift(Note.E),
        shift(Note.B),
        shift(Note.G),
        shift(Note.E),
        shift(Note.B),
        shift(Note.E),
        shift(Note.B),
        shift(Note.E),
      ]);
      break;
    case "open":
      tuning = tuning.concat([
        shift(Note.E),
        shift(Note.B),
        shift(Note["G#"]),
        shift(Note.E),
        shift(Note.B),
        shift(Note.E),
        shift(Note.B),
        shift(Note.E),
      ]);
      break;
  }

  // Limit to the specified number of strings and reverse the order
  tuning.length = stringCount;

  if (type === "drop") {
    tuning[tuning.length - 1] =
      (NOTE_COUNT + tuning[tuning.length - 1] - 2) % NOTE_COUNT;
  }

  return tuning;
}

function processRootNote(
  stringCounts: number[],
  tuningTypes: TuningType[],
  rootNote: Note,
  tunings: { [key: string]: TuningData }
) {
  for (const stringCount of stringCounts) {
    for (const type of tuningTypes) {
      const name = `${Note[rootNote]} ${type}${
        stringCount === 6 ? "" : ` ${stringCount}-string`
      }`;
      const tuning = generateTuning(rootNote, type, stringCount);

      // Calculate octaves
      let baseOctave = 5;

      if (type === "folk" || type === "celtic") {
        if (rootNote <= Note["C#"] || rootNote > Note.E) {
          baseOctave--;
        }
      } else if (rootNote > Note.E) {
        baseOctave--;
      }

      const octaveNotes = getStringOctaves(tuning, baseOctave);

      const shift = (Note.E - rootNote + NOTE_COUNT) % NOTE_COUNT;
      const tuningString = tuning.map((note) => Note[note]).join("");

      if (!tunings[tuningString]) {
        tunings[tuningString] = {
          name,
          shift: shift === 0 ? undefined : -shift,
          octaveNotes,
        };
      }
    }
  }
}
