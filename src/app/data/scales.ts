import { Note, NOTE_COUNT } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import { capoValue, tuningValue } from "@/app/store/settingsSlice";

export type Scale = number[];

export const SPECIAL = "Special";
export const CHROMATIC = "Chromatic (All notes)";

export const scalesMap: Map<string, Map<string, Scale>> = new Map([
  [
    "Minor",
    new Map([
      ["Aeolian / Natural", [2, 3, 5, 7, 8, 10]],
      ["Phrygian", [1, 3, 5, 7, 8, 10]],
      ["Lydian", [2, 4, 6, 7, 8, 10]],
      ["Locrian", [1, 3, 5, 6, 8, 10]],
      ["Locrian + Major", [1, 3, 5, 6, 7, 8, 10]],
      ["Harmonic Bebop + #4", [2, 3, 5, 6, 7, 8, 10, 11]],
      ["Melodic", [2, 3, 5, 7, 9, 11]],
      ["Dorian", [2, 3, 5, 7, 9, 10]],
      ["Pentatonic Minor", [3, 5, 7, 10]],
    ]),
  ],
  [
    "Major",
    new Map([
      ["Ionian", [2, 4, 5, 7, 9, 11]],
      ["Pentatonic Major", [2, 4, 7, 9]],
      ["Pentatonic Dominant", [2, 4, 7, 10]],
      ["Lydian", [2, 4, 6, 7, 9, 11]],
      ["Lydian Augmented", [2, 4, 6, 8, 9, 11]],
      ["Mixolydian", [2, 4, 5, 7, 9, 10]],
    ]),
  ],
  [
    "Middle Eastern",
    new Map([
      ["Hijaz / Ahaba Rabba", [1, 4, 5, 7, 8, 10]],
      ["Arabian", [2, 4, 5, 6, 8, 10]],
      ["Persian", [1, 4, 5, 6, 8, 11]],
      ["Mohammedan / Harmonic", [2, 3, 5, 7, 8, 11]],
      ["Adonai Malakh", [1, 2, 3, 5, 7, 9, 10]],
      ["Magen Abot", [1, 3, 4, 6, 8, 10, 11]],
    ]),
  ],
  [
    "Far Eastern",
    new Map([
      ["Iwato", [1, 5, 6, 10]],
      ["Kumoi", [2, 3, 7, 9]],
      ["Kumoi 2", [1, 5, 7, 8]],
      ["In sen", [1, 5, 7, 10]],
      ["Japanese", [2, 5, 7, 8]],
      ["Ichikosucho", [2, 4, 5, 6, 7, 9, 11]],
      ["Taishikicho", [2, 4, 5, 6, 7, 9, 10, 11]],
      ["Hirajoshi", [2, 3, 7, 8]],
      ["Hirajoshi 2", [4, 5, 9, 11]],
      ["Chinese", [4, 6, 7, 11]],
      ["Chinese Yo", [2, 5, 7, 9]],
    ]),
  ],
  [
    "Gypsy",
    new Map([
      ["Byzantine", [1, 4, 5, 7, 8, 11]],
      ["Romanian", [2, 3, 7, 9, 11]],
      ["Romanian Minor", [2, 3, 6, 7, 9, 10]],
      ["Hungarian Major", [3, 4, 6, 7, 9, 10]],
      ["Hungarian Minor", [2, 3, 6, 7, 8, 11]],
    ]),
  ],
  [
    "Various Exotic",
    new Map([
      ["Narayan", [2, 3, 7, 9, 10]],
      ["Hindu", [2, 4, 5, 7, 8, 10]],
      ["Neapolitan", [1, 3, 5, 7, 8, 11]],
      ["Neapolitan Major", [1, 3, 5, 7, 9, 11]],
      ["Algerian", [2, 3, 5, 6, 7, 8, 11]],
      ["Pelog / Balinese", [1, 3, 7, 8]],
      ["Pelog 2", [1, 3, 7, 10]],
      ["Egyptian  / Harmonic", [2, 5, 7, 10]],
      ["Oriental 1", [1, 4, 5, 6, 11]],
      ["Oriental 2", [1, 4, 5, 6, 8, 10]],
      ["Oriental 3", [1, 4, 5, 6, 9, 10]],
      ["Eight Tone Spanish", [1, 3, 4, 5, 6, 8, 10]],
      ["Javaneese", [1, 3, 5, 7, 9, 10]],
      ["Prometheus", [2, 4, 6, 9, 10]],
      ["Prometheus Neapolitan", [1, 4, 6, 9, 10]],
      ["Moorish Phrygian", [1, 3, 4, 5, 7, 8, 10, 11]],
    ]),
  ],
  [
    "Blues",
    new Map([
      ["Blues 1", [3, 5, 6, 7, 10]],
      ["Blues 2", [3, 5, 6, 7, 10, 11]],
      ["Blues 3", [3, 4, 5, 6, 7, 10, 11]],
      ["Blues 4", [3, 4, 5, 6, 7, 9, 10, 11]],
      ["Blues Major", [2, 3, 4, 7, 9]],
      ["Mixo-Blues", [3, 4, 5, 6, 7, 10]],
    ]),
  ],
  [
    "Bebop Jazz",
    new Map([
      ["Bebop Major", [2, 4, 5, 7, 8, 9, 11]],
      ["Bebop Minor", [2, 3, 4, 5, 7, 9, 10]],
      ["Bebop Dominant", [2, 4, 5, 7, 9, 10, 11]],
      ["Bebop Half Diminished", [1, 3, 5, 6, 7, 8, 11]],
    ]),
  ],
  [
    SPECIAL,
    new Map([
      [CHROMATIC, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
      ["Whole tone", [2, 4, 6, 8, 10]],
      ["Leading whole tone", [2, 4, 6, 8, 10, 11]],
      ["Diminished", [2, 3, 5, 6, 8, 9, 11]],
      ["Diminished Half", [1, 3, 4, 6, 7, 9, 10]],
      ["Diminished Whole Tone", [1, 3, 4, 6, 8, 10]],
      ["Octatonic", [1, 3, 4, 67, 9, 10]],
      ["Augmented", [3, 4, 6, 8, 11]],
      ["Enigmatic", [1, 4, 6, 8, 10, 11]],
      ["Nine Tone", [2, 3, 4, 6, 7, 8, 9, 11]],
      ["Overtone", [2, 4, 6, 7, 9, 10]],
      ["Six Tone Symmetrical", [1, 4, 5, 8, 9]],
      ["Altered", [1, 3, 4, 6, 7, 8]],
      ["Lydian Diminished", [2, 3, 6, 7, 9, 11]],
      ["Lydian Alternative", [3, 4, 6, 7, 9, 11]],
      ["Locrian Alternative", [2, 3, 5, 6, 8, 10]],
      ["Locrian Alternative 2", [1, 3, 5, 6, 9, 10]],
      ["UltraLocrian", [1, 3, 4, 6, 8, 9, 10]],
      ["Ionian Alternative", [2, 4, 5, 8, 9, 11]],
    ]),
  ],
]);

export const getScalePattern = (
  scaleGroup: string,
  scale: string,
  useShiftedNotes: boolean = false
) => {
  let scaleNotes = scalesMap.get(scaleGroup)?.get(scale)?.concat([0]);
  if (useShiftedNotes) {
    scaleNotes = scaleNotes?.map(getShiftedNoteWithCapo);
  }
  return new Set(scaleNotes);
};

export const getShiftedNoteWithCapo = (note: Note) => {
  return (getShiftedNote(note, tuningValue) + capoValue) % NOTE_COUNT;
};
