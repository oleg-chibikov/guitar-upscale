import { NOTE_COUNT, Note, OctaveNote } from "@/app/data/notes";

export const midiToOctaveNote = (midi: number): OctaveNote => ({
  octave: Math.floor(midi / NOTE_COUNT),
  note: (midi % NOTE_COUNT) as Note,
});

export const parseBandAndTitle = (fileName: string) => {
  const name = fileName.replace(/\.[^.]+$/, "");
  const separator = name.indexOf(" - ");
  return separator === -1
    ? { band: "", title: name }
    : {
        band: name.slice(0, separator).trim(),
        title: name.slice(separator + 3).trim(),
      };
};

const FLAT_TO_SHARP: Record<string, string> = {
  Cb: "B",
  Db: "C#",
  Eb: "D#",
  Fb: "E",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

// Accepts "Em", "Bb7", "F#dim", "C/G". Returns undefined for lyrics and other text
export const normalizeChordName = (text: string): string | undefined => {
  const match = /^([A-G])([#b]?)([^\s/]*)(\/[A-G][#b]?)?$/.exec(text.trim());
  if (!match) {
    return undefined;
  }
  const [, letter, accidental, suffix] = match;
  if (!/^(m|M|maj|min|dim|aug|sus|add|\d|\+|-|°|ø|#|b|\(|\))*$/.test(suffix)) {
    return undefined;
  }
  const root =
    accidental === "b"
      ? FLAT_TO_SHARP[letter + accidental]
      : letter + accidental;
  return root + suffix;
};

// Folder and file names can't hold "/", so "Aeolian / Natural" sits in "Aeolian - Natural"
export const toFileName = (text: string) =>
  text
    .replace(/\s*\/\s*/g, (match) => (match.trim() === match ? "-" : " - "))
    .replace(/[\\:*?"<>|]/g, "");
