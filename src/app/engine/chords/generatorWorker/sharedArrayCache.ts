import { FingerAssignment } from "@/app/data/chordModes";
import { NoteInChord } from "@/app/data/notes";

// Number keys stay exact up to 8 strings and 62 frets.
const FRET_KEY_BASE = 64;
const FINGER_KEY_BASE = 8;

// The same voicing comes out once per finger layout. Equal arrays share one copy,
// so the worker message stays smaller and the chord detector can skip repeats by reference.
export class SharedArrayCache {
  private variations = new Map<number, NoteInChord[]>();
  private fingerAssignments = new Map<number, FingerAssignment>();

  getVariation(chordBuilder: NoteInChord[]): NoteInChord[] {
    let key = 0;
    for (const note of chordBuilder) {
      key = key * FRET_KEY_BASE + (note === undefined ? 0 : note.fret + 1);
    }
    let variation = this.variations.get(key);
    if (variation === undefined) {
      variation = [...chordBuilder];
      this.variations.set(key, variation);
    }
    return variation;
  }

  getFingerAssignment(fingerAssignment: FingerAssignment): FingerAssignment {
    let key = 0;
    for (const finger of fingerAssignment) {
      key = key * FINGER_KEY_BASE + (finger === undefined ? 0 : finger + 1);
    }
    let shared = this.fingerAssignments.get(key);
    if (shared === undefined) {
      shared = [...fingerAssignment];
      this.fingerAssignments.set(key, shared);
    }
    return shared;
  }
}
