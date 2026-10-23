import { StringOctaveNoteWithFingerPosition } from "@/app/data/chordModes";
import { MAX_STRING_INDEX_FOR_CHORD_GENERATION } from "@/app/data/chordsGeneratorTypes";
import { NOTE_COUNT, Neck, Note, OctaveNote } from "@/app/data/notes";
import { getPossibleFretRangeForChord } from "@/app/helpers/slashChordHelper";

const getPitch = ({ octave, note }: OctaveNote) => octave * NOTE_COUNT + note;

type Candidate = {
  voicing: StringOctaveNoteWithFingerPosition[];
  missingNotes: number;
  droppedNotes: number;
  distance: number;
  pitch: number;
};

const compareCandidates = (a: Candidate, b: Candidate) =>
  a.missingNotes - b.missingNotes ||
  a.droppedNotes - b.droppedNotes ||
  a.distance - b.distance ||
  a.pitch - b.pitch;

/**
 * Puts the slash note under the chord. Notes on the bass string and below,
 * and notes not higher than the new bass, are dropped.
 * Notes are ordered from the highest string to the lowest, so the last one is the bass.
 * Returns undefined when the chord already has this bass or no hand position fits.
 */
export const getSlashChordVoicing = (
  notes: StringOctaveNoteWithFingerPosition[],
  slashNote: Note,
  neck: Neck,
  capo: number,
): StringOctaveNoteWithFingerPosition[] | undefined => {
  if (!notes.length) {
    return;
  }
  const bassNote = notes[notes.length - 1].stringOctaveNote;
  if (bassNote.note === slashNote) {
    return;
  }
  const chordNotes = new Set(notes.map((x) => x.stringOctaveNote.note));
  let best: Candidate | undefined;

  const stringCount = Math.min(
    MAX_STRING_INDEX_FOR_CHORD_GENERATION + 1,
    neck.length,
  );
  for (let string = 0; string < stringCount; string++) {
    for (let fret = capo; fret < neck[string].length; fret++) {
      const candidate = neck[string][fret];
      if (candidate?.note !== slashNote) {
        continue;
      }
      const pitch = getPitch(candidate);
      const kept = notes.filter(
        (x) =>
          x.stringOctaveNote.string < string &&
          getPitch(x.stringOctaveNote) > pitch,
      );
      if (kept.length < 2) {
        continue;
      }
      if (fret !== capo) {
        const { minAllowedFretIndex, maxAllowedFretIndex } =
          getPossibleFretRangeForChord(
            kept.map((x) => x.stringOctaveNote),
            capo,
          );
        if (fret < minAllowedFretIndex || fret > maxAllowedFretIndex) {
          continue;
        }
      }
      const keptNotes = new Set(kept.map((x) => x.stringOctaveNote.note));
      const current: Candidate = {
        voicing: [
          ...kept,
          { stringOctaveNote: candidate, fingerIndex: undefined },
        ],
        missingNotes: [...chordNotes].filter(
          (note) => note !== slashNote && !keptNotes.has(note),
        ).length,
        droppedNotes: notes.length - kept.length,
        distance: fret === capo ? 0 : Math.abs(fret - bassNote.fret),
        pitch,
      };
      if (!best || compareCandidates(current, best) < 0) {
        best = current;
      }
    }
  }
  return best?.voicing;
};
