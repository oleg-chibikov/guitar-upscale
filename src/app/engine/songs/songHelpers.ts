import { NOTE_COUNT, Note, OctaveNote, getNoteText } from "@/app/data/notes";
import { Chord, Note as NoteName } from "tonal";

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

// Accepts "Em", "Bb7", "F#dim", "C/G" and writes the root with a sharp. Returns undefined for lyrics and other text
export const normalizeChordName = (text: string): string | undefined => {
  const name = text.trim();
  const { empty, tonic } = Chord.get(name);
  if (empty || tonic === null || tonic === "") {
    return undefined;
  }
  const [, type] = Chord.tokenize(name);
  return getNoteText(NoteName.chroma(tonic)) + type;
};

// Folder and file names can't hold "/", so "Aeolian / Natural" sits in "Aeolian - Natural"
export const toFileName = (text: string) =>
  text
    .replace(/\s*\/\s*/g, (match) => (match.trim() === match ? "-" : " - "))
    .replace(/[\\:*?"<>|]/g, "");
