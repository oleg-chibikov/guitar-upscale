import { TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { getInstrumentForProgram } from "@/app/data/instruments";
import { Note } from "@/app/data/notes";
import {
  Song,
  SongChord,
  SongTrack,
  TabNote,
  isChordsTrackName,
  isMelodyTrackName,
} from "@/app/data/song";
import {
  midiToOctaveNote,
  normalizeChordName,
  parseBandAndTitle,
} from "@/app/engine/songs/songHelpers";
import type * as AlphaTab from "@coderline/alphatab";

// alphaTab counts 960 ticks in a quarter note
const GP_TICKS_IN_QUARTER = 960;

const toAppTicks = (gpTicks: number) =>
  Math.round((gpTicks / GP_TICKS_IN_QUARTER) * TICKS_IN_BEAT);

type PlayedBar = { index: number; start: number };

// Repeats and endings are expanded in the order alphaTab plays them
const getPlayedBars = (
  alphaTab: typeof AlphaTab,
  score: AlphaTab.model.Score,
  settings: AlphaTab.Settings,
): PlayedBar[] => {
  const midiFile = new alphaTab.midi.MidiFile();
  const generator = new alphaTab.midi.MidiFileGenerator(
    score,
    settings,
    new alphaTab.midi.AlphaSynthMidiFileHandler(midiFile),
  );
  generator.generate();
  return generator.tickLookup.masterBars.map((lookup) => ({
    index: lookup.masterBar.index,
    start: lookup.start,
  }));
};

const readTrack = (
  track: AlphaTab.model.Track,
  playedBars: PlayedBar[],
): SongTrack | undefined => {
  const staff = track.staves.at(0);
  if (staff === undefined || staff.isPercussion) {
    return undefined;
  }

  const isChords = isChordsTrackName(track.name);
  // alphaTab lists the tuning from the highest string, as the app does
  const tuning = staff.tuning.map(midiToOctaveNote);
  const hasStrings = tuning.length > 0;
  const result: SongTrack = {
    name: track.name,
    instrument:
      isChords || isMelodyTrackName(track.name)
        ? undefined
        : getInstrumentForProgram(track.playbackInfo.program),
    tuning: hasStrings ? tuning : undefined,
    tabNotes: [],
    pitchNotes: [],
    chords: [],
  };

  for (const playedBar of playedBars) {
    const bar = staff.bars[playedBar.index];
    for (const voice of bar?.voices ?? []) {
      for (const beat of voice.beats) {
        const notes = beat.notes.filter((note) => !note.isTieDestination);
        if (beat.isRest || notes.length === 0) {
          continue;
        }
        const tick = toAppTicks(playedBar.start + beat.playbackStart);
        const duration = Math.max(1, toAppTicks(beat.playbackDuration));

        if (isChords) {
          const chord: SongChord = {
            tick,
            name: normalizeChordName(beat.chord?.name ?? ""),
          };
          if (chord.name === undefined) {
            chord.notes = notes.map((note) => midiToOctaveNote(note.realValue));
          }
          result.chords.push(chord);
          continue;
        }

        for (const note of notes) {
          if (hasStrings && note.isStringed) {
            const tabNote: TabNote = {
              tick,
              // alphaTab counts strings from the lowest one
              string: tuning.length - note.string,
              fret: note.fret,
              duration,
            };
            result.tabNotes.push(tabNote);
          } else {
            result.pitchNotes.push({
              tick,
              octaveNote: midiToOctaveNote(note.realValue),
              duration,
            });
          }
        }
      }
    }
  }
  result.pitchNotes.sort((a, b) => a.tick - b.tick);
  return result;
};

export const readGuitarProSong = async (
  bytes: Uint8Array,
  fileName: string,
): Promise<Song> => {
  const alphaTab = await import("@coderline/alphatab");
  const settings = new alphaTab.Settings();
  const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(
    bytes,
    settings,
  );
  const playedBars = getPlayedBars(alphaTab, score, settings);
  const fromName = parseBandAndTitle(fileName);
  const firstBar = score.masterBars[0];

  return {
    band: score.artist?.trim() || fromName.band,
    title: score.title?.trim() || fromName.title,
    tempo: Math.round(score.tempo),
    root: Note.E,
    pickupTicks: firstBar?.isAnacrusis
      ? toAppTicks(firstBar.calculateDuration())
      : undefined,
    tracks: score.tracks
      .map((track) => readTrack(track, playedBars))
      .filter((track): track is SongTrack => track !== undefined),
  };
};
