import {
  FRET_COUNT,
  NOTE_COUNT,
  Note,
  OctaveNote,
  StringOctaveNote,
} from "@/app/data/notes";
import { Song, SongChord, SongTrack, TabNote } from "@/app/data/song";
import {
  getOctaveNotesForTuning,
  getShiftedNote,
  tunings,
} from "@/app/data/tunings";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { extractChordFromNotes } from "@/app/engine/midiParser/chordMatcher";
import { addIndividualNote } from "@/app/engine/midiParser/individualNoteMapper";
import { matchChordMode } from "@/app/engine/songs/chordNameMatcher";
import { FunctionCache } from "@/app/helpers/functionCache";
import { capoValue, neckValue, tuningValue } from "@/app/store/settingsSlice";

const matchChordWithCache = new FunctionCache(extractChordFromNotes);

const toPitch = (octaveNote: OctaveNote) =>
  octaveNote.octave * NOTE_COUNT + octaveNote.note;

export const shiftOctaveNote = (
  octaveNote: OctaveNote,
  semitones: number
): OctaveNote => {
  const value = octaveNote.octave * NOTE_COUNT + octaveNote.note + semitones;
  return {
    octave: Math.floor(value / NOTE_COUNT),
    note: ((value % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT,
  };
};

// Songs in E keep the old behaviour: they move by the capo and the tuning shift.
// Other songs take the smallest move to the key in the settings
const getSemitoneShift = (root: Note) => {
  const settingsShift = capoValue + (tunings[tuningValue].shift ?? 0);
  const rootOffset = (root - Note.E + NOTE_COUNT) % NOTE_COUNT;
  if (rootOffset === 0) {
    return settingsShift;
  }
  const shift =
    (((settingsShift - rootOffset) % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT;
  return shift > NOTE_COUNT / 2 ? shift - NOTE_COUNT : shift;
};

export const transposeChordName = (chord: string, semitones: number) => {
  if (semitones % NOTE_COUNT === 0) {
    return chord;
  }
  const { chordBaseNote, alterations } = parseChordNoteAndAlterations(chord);
  if (chordBaseNote === undefined) {
    return chord;
  }
  const newBaseNote =
    (((chordBaseNote + semitones) % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT;
  return Note[newBaseNote] + alterations;
};

export class SongDecoder {
  private readonly song: Song;
  private readonly shift: number;
  private readonly currentTuning = getOctaveNotesForTuning(tuningValue);

  constructor(song: Song) {
    if (!neckValue) {
      throw new Error("Neck is not set up");
    }
    this.song = song;
    this.shift = getSemitoneShift(song.root);
  }

  async decode(): Promise<EventsByTick> {
    const decodedTracks: EventsByTick[] = [];
    for (const [trackNumber, track] of this.song.tracks.entries()) {
      decodedTracks.push(await this.decodeTrack(track, trackNumber));
    }
    return EventsByTick.merge(...decodedTracks);
  }

  private async decodeTrack(track: SongTrack, trackNumber: number) {
    const result = new EventsByTick();
    for (const tabNote of track.tabNotes) {
      this.addTabNote(result, track, trackNumber, tabNote);
    }

    let previousNote: StringOctaveNote | undefined;
    for (const pitchNote of track.pitchNotes) {
      previousNote =
        this.addPitchNote(
          result,
          track,
          trackNumber,
          pitchNote.tick,
          pitchNote.octaveNote,
          pitchNote.duration,
          previousNote,
          pitchNote.velocity
        ) ?? previousNote;
    }

    for (const chord of track.chords) {
      await this.addChord(result, track, trackNumber, chord);
    }
    return result;
  }

  private addTabNote(
    result: EventsByTick,
    track: SongTrack,
    trackNumber: number,
    tabNote: TabNote
  ) {
    const trackTuning = track.tuning ?? [];
    const songString = trackTuning.at(tabNote.string);
    const currentString = this.currentTuning.at(tabNote.string);
    const neckString = neckValue?.at(tabNote.string);
    if (songString === undefined) {
      return;
    }

    // a bass or a 7 string track can't keep its strings on this neck
    const sameStrings = trackTuning.length === this.currentTuning.length;
    if (
      sameStrings &&
      currentString !== undefined &&
      neckString !== undefined
    ) {
      // the melody is written for the song's tuning, so it moves by the difference between the strings
      const tuningDifference = toPitch(songString) - toPitch(currentString);
      let fret = tabNote.fret + this.shift + tuningDifference;
      if (fret < 0) {
        fret += NOTE_COUNT;
      }
      if (fret > FRET_COUNT) {
        fret = NOTE_COUNT + (fret % FRET_COUNT);
      }
      const stringOctaveNote = neckString[fret];
      if (stringOctaveNote) {
        result.addEventAtTick(
          tabNote.tick,
          {
            trackNumber,
            instrument: track.instrument,
            note: stringOctaveNote,
            velocity: tabNote.velocity,
          },
          tabNote.duration
        );
        return;
      }
    }

    // the string is missing on this neck, so the app picks a string by the pitch
    this.addPitchNote(
      result,
      track,
      trackNumber,
      tabNote.tick,
      shiftOctaveNote(songString, tabNote.fret),
      tabNote.duration,
      undefined,
      tabNote.velocity
    );
  }

  private addPitchNote(
    result: EventsByTick,
    track: SongTrack,
    trackNumber: number,
    tick: number,
    octaveNote: OctaveNote,
    duration: number | undefined,
    previousNote?: StringOctaveNote,
    velocity?: number
  ) {
    const stringOctaveNote = addIndividualNote(
      {
        tick,
        octaveNote: shiftOctaveNote(octaveNote, this.shift),
        duration: duration ?? 0,
        velocity: velocity ?? 127,
      },
      previousNote
    );
    if (stringOctaveNote) {
      result.addEventAtTick(
        tick,
        {
          trackNumber,
          instrument: track.instrument,
          note: stringOctaveNote,
          velocity,
        },
        duration !== undefined ? Math.max(1, Math.round(duration)) : undefined
      );
    }
    return stringOctaveNote;
  }

  private async addChord(
    result: EventsByTick,
    track: SongTrack,
    trackNumber: number,
    chord: SongChord
  ) {
    const name =
      chord.name !== undefined
        ? transposeChordName(chord.name, this.shift)
        : await this.detectChordName(chord.notes ?? []);

    if (name !== undefined) {
      result.addEventAtTick(chord.tick, {
        chord: name,
        metadata: { trackNumber, trackInstrument: track.instrument },
      });
      return;
    }

    // the chord is not recognised, so its notes play one by one
    let previousNote: StringOctaveNote | undefined;
    for (const octaveNote of chord.notes ?? []) {
      previousNote =
        this.addPitchNote(
          result,
          track,
          trackNumber,
          chord.tick,
          octaveNote,
          undefined,
          previousNote
        ) ?? previousNote;
    }
  }

  private async detectChordName(notes: OctaveNote[]) {
    const sortedNotes = notes
      .map((note) => shiftOctaveNote(note, this.shift))
      .sort((a, b) => b.octave - a.octave || b.note - a.note);
    const exact = matchChordMode(sortedNotes);
    if (exact !== undefined) {
      return exact;
    }
    const match = await matchChordWithCache.execute(sortedNotes);
    return match?.chordName;
  }
}

export const getCurrentRoot = () => getShiftedNote(capoValue, tuningValue);
