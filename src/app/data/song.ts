import { Instrument } from "./instruments";
import { Note, OctaveNote } from "./notes";

// A note placed on the neck. String 0 is the highest string, the fret is in the track's tuning
export type TabNote = {
  tick: number;
  string: number;
  fret: number;
  duration?: number;
  // MIDI velocity from 1 to 127. Undefined plays at full volume
  velocity?: number;
};

// A note known only by its pitch, as in MIDI. The app picks the string
export type PitchNote = {
  tick: number;
  octaveNote: OctaveNote;
  duration?: number;
  velocity?: number;
};

// A chord known by its name, or by its notes when the file has no name for it
export type SongChord = {
  tick: number;
  name?: string;
  notes?: OctaveNote[];
  // the shape to write in a file, frets from the highest string
  frets?: (number | undefined)[];
};

export type SongTrack = {
  name: string;
  // undefined plays the track with the instrument picked in the settings
  instrument?: Instrument;
  // the track's tuning, highest string first. Tab notes need it
  tuning?: OctaveNote[];
  tabNotes: TabNote[];
  pitchNotes: PitchNote[];
  chords: SongChord[];
};

export type Song = {
  band: string;
  title: string;
  tempo?: number;
  // the song's key. The app moves the song from it to the key picked in the settings
  root: Note;
  // length of the pickup bar in clock ticks
  pickupTicks?: number;
  tracks: SongTrack[];
};

export type SongFormat = "gp" | "midi";

// A track with this name plays as chords only
export const CHORDS_TRACK_PREFIX = "chords";
// A track with this name plays with the instrument picked in the settings
export const MELODY_TRACK_PREFIX = "melody";

export const isChordsTrackName = (name: string | undefined) =>
  name?.trim().toLowerCase().startsWith(CHORDS_TRACK_PREFIX) ?? false;

export const isMelodyTrackName = (name: string | undefined) =>
  name?.trim().toLowerCase().startsWith(MELODY_TRACK_PREFIX) ?? false;

export const getSongFormat = (fileName: string): SongFormat | undefined => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "mid" || extension === "midi") {
    return "midi";
  }
  if (extension !== undefined && /^gp[345x]?$/.test(extension)) {
    return "gp";
  }
  return undefined;
};

export const SONG_FILE_ACCEPT = ".gp,.gp3,.gp4,.gp5,.gpx,.mid,.midi";
