import { TICKS_IN_BEAT, TICKS_IN_HALF_BEAT } from "@/app/data/clockConstants";
import { getInstrumentForProgram } from "@/app/data/instruments";
import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { Note } from "@/app/data/notes";
import {
  Song,
  SongChord,
  SongTrack,
  isChordsTrackName,
  isMelodyTrackName,
} from "@/app/data/song";
import { groupEventsByTickWithTolerance } from "@/app/engine/midiParser/groupSplitter";
import {
  midiToOctaveNote,
  normalizeChordName,
  parseBandAndTitle,
} from "@/app/engine/songs/songHelpers";
import { microsecondsToBpm } from "@/app/helpers/clockHelper";
import { AnyEvent, read } from "midifile-ts";

const PERCUSSION_CHANNEL = 9;
// a chord name may sit slightly off the chord's first note
const CHORD_NAME_TOLERANCE = TICKS_IN_HALF_BEAT / 2;

type Part = {
  name?: string;
  program?: number;
  events: NotePlayEvent[];
};

type ChordName = { tick: number; name: string };

const TEXT_SUBTYPES = new Set(["text", "marker", "lyrics", "cuePoint"]);

export const readMidiSong = (bytes: Uint8Array, fileName: string): Song => {
  const midi = read(bytes);
  const toAppTicks = (midiTicks: number) =>
    (midiTicks / midi.header.ticksPerBeat) * TICKS_IN_BEAT;
  let tempo: number | undefined;
  const chordNames: ChordName[] = [];
  const parts: Part[] = [];

  midi.tracks.forEach((track: AnyEvent[]) => {
    let position = 0;
    let trackName: string | undefined;
    const programs = new Map<number, number>();
    const partsByChannel = new Map<number, Part>();
    const openNotes = new Map<string, { tick: number; velocity: number }>();

    for (const event of track) {
      position += event.deltaTime;
      const tick = toAppTicks(position);

      if (event.type === "meta") {
        if (event.subtype === "trackName") {
          trackName = event.text;
        } else if (event.subtype === "setTempo") {
          tempo ??= microsecondsToBpm(event.microsecondsPerBeat);
        } else if (TEXT_SUBTYPES.has(event.subtype) && "text" in event) {
          const name = normalizeChordName(event.text);
          if (name !== undefined) {
            chordNames.push({ tick, name });
          }
        }
        continue;
      }

      if (event.type !== "channel" || event.channel === PERCUSSION_CHANNEL) {
        continue;
      }

      if (event.subtype === "programChange") {
        programs.set(event.channel, event.value);
      } else if (event.subtype === "noteOn" && event.velocity > 0) {
        openNotes.set(`${event.channel}:${event.noteNumber}`, {
          tick,
          velocity: event.velocity,
        });
      } else if (event.subtype === "noteOff" || event.subtype === "noteOn") {
        const key = `${event.channel}:${event.noteNumber}`;
        const start = openNotes.get(key);
        if (!start) {
          continue;
        }
        openNotes.delete(key);
        let part = partsByChannel.get(event.channel);
        if (!part) {
          part = { events: [] };
          partsByChannel.set(event.channel, part);
        }
        part.events.push({
          tick: start.tick,
          octaveNote: midiToOctaveNote(event.noteNumber),
          duration: tick - start.tick,
          velocity: start.velocity,
        });
      }
    }

    partsByChannel.forEach((part, channel) => {
      part.name = trackName;
      part.program = programs.get(channel);
      part.events.sort((a, b) => a.tick - b.tick);
      parts.push(part);
    });
  });

  const tracks = parts.map((part) => readPart(part, chordNames));
  if (chordNames.length && !tracks.some((track) => track.chords.length)) {
    // the file names its chords in text but has no Chords track, so the names alone make one
    tracks.push({
      name: "Chords",
      tabNotes: [],
      pitchNotes: [],
      chords: chordNames.map(({ tick, name }) => ({ tick, name })),
    });
  }

  return {
    ...parseBandAndTitle(fileName),
    tempo: tempo !== undefined ? Math.round(tempo) : undefined,
    root: Note.E,
    tracks,
  };
};

const readPart = (part: Part, chordNames: ChordName[]): SongTrack => {
  const name = part.name ?? "";
  const track: SongTrack = {
    name,
    tabNotes: [],
    pitchNotes: [],
    chords: [],
  };

  if (isChordsTrackName(name)) {
    for (const [tick, group] of Array.from(
      groupEventsByTickWithTolerance(part.events).entries()
    )) {
      const chord: SongChord = {
        tick,
        name: chordNames.find(
          (chordName) => Math.abs(chordName.tick - tick) <= CHORD_NAME_TOLERANCE
        )?.name,
      };
      if (chord.name === undefined) {
        chord.notes = group.map((event) => event.octaveNote);
      }
      track.chords.push(chord);
    }
    return track;
  }

  track.instrument =
    isMelodyTrackName(name) || part.program === undefined
      ? undefined
      : getInstrumentForProgram(part.program);
  track.pitchNotes = part.events.map((event) => ({
    tick: event.tick,
    octaveNote: event.octaveNote,
    duration: event.duration,
    velocity: event.velocity,
  }));
  return track;
};
