import { Note, OctaveNote, StringOctaveNote } from "../data/notes";
import { ChordEventBus } from "./eventBus";
import { Neck, NoteCount } from "./generateNeckRepresentation";

export const decodeMelody = async (
  melody: string,
  play: (note: StringOctaveNote) => void,
  waitNote: () => Promise<void>,
  neck: Neck,
  scriptTuning: OctaveNote[],
  tuning: OctaveNote[],
  baseNote: Note,
  isPlayingRef: React.MutableRefObject<boolean>
): Promise<void> => {
  let index = 0;
  let stringNumber: number | undefined;
  let nextIsString = false;
  let fretNumberBuilder = "";
  let nextIsImmediateString = false;
  let nextIsImmediateChord = false;
  let immediateStringNumber: number | undefined;
  let immediateChord: string | undefined;
  let indexToRepeat: number | undefined;
  let repeatCount: number | undefined;

  while (index < melody.length) {
    if (isPlayingRef.current === false) {
      return;
    }
    const char = melody[index];
    const nextChar = index !== melody.length - 1 && melody[index + 1];
    const number = parseFloat(char);
    const isNumeric = !isNaN(number);
    const playChordAndReset = () => {
      if (immediateChord != undefined) {
        nextIsImmediateChord = false;
        ChordEventBus.next({
          chord: immediateChord,
          metadata: { notesToPlay: 3, strummingDelayMs: 10 }, // override default settings
        });
        immediateChord = undefined;
      }
    };
    if (nextIsImmediateChord) {
      if (char === ">") {
        // end recording chord
        playChordAndReset();
      } else {
        // keep recording chord
        if (!immediateChord) {
          immediateChord = char;
        } else {
          immediateChord += char;
        }
      }
    } else if (isNumeric) {
      // note
      if (nextIsImmediateString) {
        // Remember the string number to play ONLY with the next note
        immediateStringNumber = number;
        nextIsImmediateString = false;
      } else if (nextIsString) {
        stringNumber = number;
        nextIsString = false;
      } else {
        fretNumberBuilder += char;
        if (nextChar === "-") {
          // The same note continues
        } else if (immediateStringNumber !== undefined) {
          if (fretNumberBuilder !== "") {
            // Note is fully read - we can play it
            await playNote(
              baseNote,
              scriptTuning,
              tuning,
              fretNumberBuilder,
              neck,
              immediateStringNumber,
              play
            );
            fretNumberBuilder = "";
            immediateStringNumber = undefined;
          }
        } else if (fretNumberBuilder !== "" && stringNumber !== undefined) {
          // Note is fully read - we can play it
          await playNote(
            baseNote,
            scriptTuning,
            tuning,
            fretNumberBuilder,
            neck,
            stringNumber,
            play,
            waitNote
          );
          fretNumberBuilder = "";
        }
      }
    } else if (char === "(") {
      // repeat section start
      indexToRepeat = index;
    } else if (char === ")") {
      // repeat section end
      if (indexToRepeat !== undefined) {
        if (repeatCount !== undefined) {
          if (repeatCount === 0) {
            // all repeats are played
            index += 2;
            repeatCount = undefined;
            indexToRepeat = undefined;
            continue; // skip the next char which is repeat count and continue with the further melody
          } else {
            repeatCount--;
            index = indexToRepeat; // returning to the beginning of the pattern
          }
        } else {
          repeatCount = nextChar ? parseInt(nextChar) - 1 : 0;
          repeatCount--;
          index = indexToRepeat; // returning to the beginning of the pattern
        }
      }
    } else if (char === "_") {
      // wait between notes
      await waitNote();
    } else if (char === "*") {
      // set string marker for upcoming (not immediate) notes
      nextIsString = true;
    } else if (char === "^") {
      // start recording immediate string
      nextIsImmediateString = true;
    } else if (char === "<") {
      // start recording immediate string
      nextIsImmediateChord = true;
    }

    index++;
  }
};

async function playNote(
  baseNote: Note,
  scriptTuning: OctaveNote[],
  tuning: OctaveNote[],
  fretNumberBuilder: string,
  neck: Neck,
  stringNumber: number,
  play: (note: StringOctaveNote) => void,
  wait?: () => Promise<void>
) {
  const stringTuning = tuning[stringNumber]; // Get the custom tuning for the string
  const scriptStringTuning = scriptTuning[stringNumber]; // Get the original tuning for the string (melody is written using this tuning)
  let fret =
    parseInt(fretNumberBuilder) +
    baseNote +
    (scriptStringTuning.note +
      scriptStringTuning.octave * 12 -
      (stringTuning.note + stringTuning.octave * 12)); // Adjust fret position based on tuning
  while (fret < 0) {
    fret = NoteCount + fret; // take similar note but one octave higher
  }

  // TODO: go to the upper string (we already do that when playing scales)
  const string = neck[stringNumber];
  const stringOctaveNote = string[fret];
  if (stringOctaveNote) {
    await playStringOctaveNote(stringOctaveNote, play, wait);
  }
}

async function playStringOctaveNote(
  stringOctaveNote: StringOctaveNote,
  play: (note: StringOctaveNote) => void,
  wait?: () => Promise<void>
) {
  play(stringOctaveNote);
  if (wait) {
    await wait();
  }
}
