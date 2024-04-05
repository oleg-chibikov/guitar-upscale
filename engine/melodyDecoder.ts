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
  let fretNumberBuilder = "";
  while (index < melody.length) {
    if (isPlayingRef.current === false) {
      return;
    }
    const char = melody[index];
    const number = parseFloat(char);
    if (!isNaN(number)) {
      if (stringNumber === undefined) {
        stringNumber = number;
      } else {
        fretNumberBuilder += char;
      }
    } else {
      if (fretNumberBuilder !== "" && stringNumber !== undefined) {
        const fret = parseInt(fretNumberBuilder);
        const string = neck[stringNumber];
        const note = string[fret];
        if (note) {
          play({
            note: note.note,
            octave: note.octave,
            string: stringNumber,
          });
          await wait();
        }
        fretNumberBuilder = "";
      }
      if (char === "(") {
        if (stringNumber === undefined) {
          throw new Error("String not set");
        }
      } else if (char === ")") {
        stringNumber = undefined;
      } else if (char === "_") {
        await wait();
      }
    }
    index++;
  }
};
