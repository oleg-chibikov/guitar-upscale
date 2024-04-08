import { Note, StringOctaveNote } from "../data/notes";
import { Neck } from "./generateNeckRepresentation";

export const decodeMelody = async (
  melody: string,
  play: (note: StringOctaveNote) => void,
  wait: () => Promise<void>,
  neck: Neck,
  baseNote: Note,
  isPlayingRef: React.MutableRefObject<boolean>
): Promise<void> => {
  let index = 0;
  let stringNumber: number | undefined;
  let nextIsString = false;
  let fretNumberBuilder = "";
  let nextIsImmediateString = false;
  let immediateStringNumber: number | undefined;
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
    if (isNumeric) {
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
            fretNumberBuilder,
            neck,
            stringNumber,
            play,
            wait
          );
          fretNumberBuilder = "";
        }
      }
    } else if (char === "(") {
      indexToRepeat = index;
    } else if (char === ")") {
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
      await wait();
    } else if (char === "*") {
      nextIsString = true;
    } else if (char === "^") {
      nextIsImmediateString = true;
    }

    index++;
  }
};
async function playNote(
  baseNote: Note,
  fretNumberBuilder: string,
  neck: Neck,
  stringNumber: number,
  play: (note: StringOctaveNote) => void,
  wait?: () => Promise<void>
) {
  const fret = parseInt(fretNumberBuilder) + baseNote;
  const string = neck[stringNumber];
  const stringOctaveNote = string[fret];
  if (stringOctaveNote) {
    play(stringOctaveNote);
    if (wait) {
      await wait();
    }
  }
}
