import { StringOctaveNote } from "../data/notes";
import { Neck } from "./generateNeckRepresentation";

export const decodeMelody = async (
  melody: string,
  play: (note: StringOctaveNote) => void,
  wait: () => Promise<void>,
  neck: Neck,
  isPlayingRef: React.MutableRefObject<boolean>
): Promise<void> => {
  let index = 0;
  let stringNumber: number | undefined;
  let nextIsString = false;
  let fretNumberBuilder = "";
  let nextIsImmediateString = false;
  let immediateStringNumber: number | undefined;
  while (index < melody.length) {
    if (isPlayingRef.current === false) {
      return;
    }
    const char = melody[index];
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
        if (index !== melody.length - 1 && melody[index + 1] === "-") {
          // The same note continues
        } else if (immediateStringNumber !== undefined) {
          if (fretNumberBuilder !== "") {
            // Note is fully read - we can play it
            await playNote(
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
          await playNote(fretNumberBuilder, neck, stringNumber, play, wait);
          fretNumberBuilder = "";
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
  fretNumberBuilder: string,
  neck: Neck,
  stringNumber: number,
  play: (note: StringOctaveNote) => void,
  wait?: () => Promise<void>
) {
  const fret = parseInt(fretNumberBuilder);
  const string = neck[stringNumber];
  const note = string[fret];
  if (note) {
    play({
      note: note.note,
      octave: note.octave,
      string: stringNumber,
    });
    if (wait) {
      await wait();
    }
  }
}
