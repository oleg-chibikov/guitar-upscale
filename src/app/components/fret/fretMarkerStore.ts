import { MAX_STRING_INDEX_FOR_CHORD_GENERATION } from "@/app/data/chordsGeneratorTypes";
import {
  StringOctaveNote,
  serializeStringOctaveNote,
} from "@/app/data/notes";
import {
  ClearNoteMetadata,
  NoteMetadata,
  NoteToFretMarkerEventMap,
} from "@/app/engine/eventBus";
import {
  chordIsBeingDetectedValue,
  scaleIsBeingDetectedValue,
} from "@/app/store/settingsSlice";

export const PRESS_ANIMATION_MS = 300;
export const BLAST_ANIMATION_MS = 300;
// the chord buttons give their notes this colour
const CHORD_TRACK = 5;

export interface FretMarkerState {
  chordFinger: number | undefined;
  isFromPreviousChord: boolean;
  isChordBeingDetected: boolean;
  isScaleBeingDetected: boolean;
  pressStartedAt: number | undefined;
  blastStartedAt: number | undefined;
  blastTrack: number;
}

export const markerKey = (string: number, fret: number) => `${string}:${fret}`;

/**
 * What each note on the neck shows right now. The fretboard canvas draws from it.
 */
export class FretMarkerStore {
  private states = new Map<string, FretMarkerState>();
  private listener: (() => void) | undefined;

  get(string: number, fret: number): FretMarkerState | undefined {
    return this.states.get(markerKey(string, fret));
  }

  onChange(listener: () => void) {
    this.listener = listener;
  }

  isAnimating(now: number) {
    for (const state of this.states.values()) {
      if (
        (state.pressStartedAt !== undefined &&
          now - state.pressStartedAt < PRESS_ANIMATION_MS) ||
        (state.blastStartedAt !== undefined &&
          now - state.blastStartedAt < BLAST_ANIMATION_MS)
      ) {
        return true;
      }
    }
    return false;
  }

  private getOrCreate({ string, fret }: StringOctaveNote) {
    const key = markerKey(string, fret);
    let state = this.states.get(key);
    if (!state) {
      state = {
        chordFinger: undefined,
        isFromPreviousChord: false,
        isChordBeingDetected: false,
        isScaleBeingDetected: false,
        pressStartedAt: undefined,
        blastStartedAt: undefined,
        blastTrack: 0,
      };
      this.states.set(key, state);
    }
    return state;
  }

  private changed() {
    this.listener?.();
  }

  /**
   * Listens to the notes played on the neck. Returns a function that stops listening.
   */
  register(neck: (StringOctaveNote | null)[][]) {
    const keys: string[] = [];
    for (const row of neck) {
      for (const stringOctaveNote of row) {
        if (!stringOctaveNote) {
          continue;
        }
        const key = serializeStringOctaveNote(stringOctaveNote);
        keys.push(key);
        NoteToFretMarkerEventMap.set(key, (metadata) =>
          this.handleNote(stringOctaveNote, metadata)
        );
      }
    }
    return () => {
      keys.forEach((key) => NoteToFretMarkerEventMap.delete(key));
    };
  }

  private async handleNote(
    stringOctaveNote: StringOctaveNote,
    metadata: NoteMetadata | ClearNoteMetadata
  ) {
    const state = this.getOrCreate(stringOctaveNote);
    try {
      if ((metadata as ClearNoteMetadata).clearChordMarker === true) {
        state.isFromPreviousChord = false;
        state.chordFinger = undefined;
        return;
      }
      const noteMetadata = metadata as NoteMetadata;
      if (
        chordIsBeingDetectedValue &&
        stringOctaveNote.string <= MAX_STRING_INDEX_FOR_CHORD_GENERATION &&
        noteMetadata.skipChordDetection !== true
      ) {
        // this module is only loaded once the chord detection button is pressed
        const { chordDetectorBuilder } = await import(
          "@/app/engine/chords/chordDetectorBuilder"
        );
        state.isChordBeingDetected = true;
        void chordDetectorBuilder.addNote({
          stringOctaveNote,
          clear: () => {
            state.isChordBeingDetected = false;
            this.changed();
          },
        });
      }

      if (
        scaleIsBeingDetectedValue &&
        noteMetadata.skipChordDetection !== true
      ) {
        const { scaleDetectorBuilder } = await import(
          "@/app/engine/scales/scaleDetectorBuilder"
        );
        state.isScaleBeingDetected = true;
        scaleDetectorBuilder.addNote({
          stringOctaveNote,
          clear: () => {
            state.isScaleBeingDetected = false;
            this.changed();
          },
        });
      }

      // several tracks may play the same note at once, the last one sets the colour
      state.blastTrack =
        noteMetadata.looperChannel ??
        noteMetadata.trackNumber ??
        (noteMetadata.fromChord === true ? CHORD_TRACK : 0);

      if (noteMetadata.fromChord === true) {
        state.isFromPreviousChord = true;
        state.chordFinger = noteMetadata.chordFinger;
      }
      const now = performance.now();
      state.pressStartedAt = now;
      state.blastStartedAt = now;
    } finally {
      this.changed();
    }
  }
}
