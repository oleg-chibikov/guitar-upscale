import { Subject } from "rxjs";
import { Instrument } from "../data/instruments";
import { StringOctaveNote, serializeStringOctaveNote } from "../data/notes";
import {
  chordInstrumentValue,
  instrumentValue,
  reverbStrengthValue,
  tempoBpmValue,
  velocityValue,
} from "../store/settingsSlice";
import { currentlyRecordingLooperChannel } from "./looperShared";
import { beatToMilliseconds } from "./mainClock";
import { playNote } from "./sound/soundProvider";

export type PlayNoteParams = {
  stringOctaveNote: StringOctaveNote;
  velocity?: number; // TODO: so far it is not supplied anywhere, but we might need to implement velocity per single note. It should also be relative to the main velocity. Actually main velocity is actually volume. Change it - there is Volume in smplr
};

export type TrackMetadata = {
  trackNumber?: number;
  trackInstrument?: Instrument;
};

export type ClearNoteMetadata = {
  clearChordMarker?: boolean;
};

export type NoteMetadata = StrummingMetadata &
  TrackMetadata &
  PlayNoteParams & {
    fromChord?: boolean;
    skipChordDetection?: boolean;
    fromLooper?: boolean;
  };

export type StrummingMetadata = {
  playedSeparatelyFromStrumming?: boolean; // It comes from strumming - the chord can be either played right after click or during strumming.
  strummingClickNumber?: number; // It comes from strumming and identifies particular strumming sequence
};

export type ChordMetadata = StrummingMetadata &
  TrackMetadata & {
    notesToPlay?: number;
    strummingDelayMs?: number;
    clear?: boolean;
  };

export type ChordWithPlayMetadata = {
  chord: string;
  metadata: ChordMetadata;
};

type TickInfo = {
  isBar: boolean;
  isBeat: boolean;
  tick: number;
};

export const NotePlayEventBus = new Subject<NoteMetadata>();
export const ChordEventBus = new Subject<ChordWithPlayMetadata>();
export const MetronomeEventBus = new Subject<TickInfo>();

export const NoteToFretMarkerEventMap: Map<
  string,
  (metadata: NoteMetadata | ClearNoteMetadata) => void
> = new Map<string, () => void>();

export const ChordToChordButtonEventMap: Map<
  string,
  (metadata: ChordMetadata) => void
> = new Map<string, (metadata: ChordMetadata) => void>();

export const fretMarkersFromPreviousChord: Set<string> = new Set<string>();
export let previousChord: string;

const play = async ({
  stringOctaveNote,
  trackInstrument,
  velocity,
  fromChord,
}: NoteMetadata) => {
  // This module is essential and should be loaded asap, so I commented out lazy loading here
  // const playNote = (await import("@/app/engine/sound/soundProvider"))
  //   .playNote;
  await playNote(
    stringOctaveNote,
    velocity ?? velocityValue,
    trackInstrument ?? (fromChord ? chordInstrumentValue : instrumentValue),
    // instrumentRef.current ?? instrument,
    reverbStrengthValue,
    beatToMilliseconds(tempoBpmValue)
  );
};

NotePlayEventBus.subscribe(async (noteMetadata: NoteMetadata) => {
  void play(noteMetadata);
  //console.log("EventBus: Note play requested", noteMetadata.stringOctaveNote);
  const serialized = serializeStringOctaveNote(noteMetadata.stringOctaveNote);
  const animateAction = NoteToFretMarkerEventMap.get(serialized);
  if (noteMetadata.fromChord && animateAction) {
    fretMarkersFromPreviousChord.add(serialized);
  }

  const fromImmediateChord =
    noteMetadata.playedSeparatelyFromStrumming ?? false;
  const midiRecorder = (await import("./midiRecorder")).midiRecorder;
  const trackNumber =
    noteMetadata.trackNumber ?? (noteMetadata.fromChord ? 1 : 0);
  const trackInstrument =
    noteMetadata.trackInstrument ??
    (noteMetadata.fromChord ? chordInstrumentValue : instrumentValue);
  midiRecorder.addNoteToMidiTrack(
    noteMetadata.stringOctaveNote,
    trackNumber,
    trackInstrument,
    false,
    fromImmediateChord,
    noteMetadata.strummingClickNumber
  );

  if (
    !noteMetadata.fromLooper &&
    currentlyRecordingLooperChannel !== undefined
  ) {
    const { looperState } = await import("./looper");
    looperState[
      currentlyRecordingLooperChannel
    ].midiRecorder.addNoteToMidiTrack(
      noteMetadata.stringOctaveNote,
      trackNumber,
      trackInstrument,
      true,
      fromImmediateChord,
      noteMetadata.strummingClickNumber
    );
  }

  animateAction?.(noteMetadata);
});

export const clearPreviousChords = () => {
  if (previousChord) {
    const previousChordAction = ChordToChordButtonEventMap.get(previousChord);
    previousChordAction?.({
      clear: true,
    });
  }
  for (const note of Array.from(fretMarkersFromPreviousChord)) {
    const noteFromThePreviousChordAction = NoteToFretMarkerEventMap.get(note);
    noteFromThePreviousChordAction?.({
      clearChordMarker: true,
    });
  }
  fretMarkersFromPreviousChord.clear(); // clear previous chord;
};

ChordEventBus.subscribe((chordWithMetadata: ChordWithPlayMetadata) => {
  console.log("EventBus: Chord play requested", chordWithMetadata);

  // don't check for the same chord here - we need to clear the previous variation of the same chord (they might differ)
  clearPreviousChords();
  previousChord = chordWithMetadata.chord;

  const playAction = ChordToChordButtonEventMap.get(chordWithMetadata.chord);

  playAction?.(chordWithMetadata.metadata);
});
