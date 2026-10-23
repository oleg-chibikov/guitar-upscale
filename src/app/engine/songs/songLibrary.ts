import { AlertType } from "@/app/data/alertType";
import { DistinctNoteMarker } from "@/app/data/midiParser/distinctNoteMarker";
import { Example, ExamplesMap, getExampleName } from "@/app/data/example";
import { NOTE_COUNT, Note, initNotesArray } from "@/app/data/notes";
import { CHROMATIC, SPECIAL, scalesMap } from "@/app/data/scales";
import { Song, SongFormat, getSongFormat } from "@/app/data/song";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { pianoRollEdits$ } from "@/app/engine/pianoRoll/editHistory";
import { scaleDetector } from "@/app/engine/scales/scaleDetector";
import { ScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";
import { toFileName } from "@/app/engine/songs/songHelpers";
import {
  UserSongRecord,
  deleteUserSong,
  getUserSongs,
  saveUserSong,
} from "@/app/engine/songs/userSongStore";
import { store } from "@/app/store/store";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { Subject, debounceTime } from "rxjs";
import { v4 as uuidv4 } from "uuid";

const SONGS_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/songs`;

// One line of public/songs/index.json. Folders give the scale group and the scale
type IndexEntry = { path: string; band: string; title: string };

const findScale = (groupFolder: string, scaleFolder: string) => {
  for (const [group, scales] of Array.from(scalesMap.entries())) {
    if (toFileName(group) !== groupFolder) {
      continue;
    }
    for (const scale of Array.from(scales.keys())) {
      if (toFileName(scale) === scaleFolder) {
        return { scaleGroup: group, scale };
      }
    }
  }
  return undefined;
};

export const readSong = async (
  bytes: ArrayBuffer,
  fileName: string,
  format: SongFormat
): Promise<Song> => {
  if (format === "midi") {
    const { readMidiSong } = await import("@/app/engine/songs/midiReader");
    return readMidiSong(new Uint8Array(bytes), fileName);
  }
  const { readGuitarProSong } = await import("@/app/engine/songs/gpReader");
  return readGuitarProSong(new Uint8Array(bytes), fileName);
};

const loadBuiltInExamples = async (): Promise<Example[]> => {
  let entries: IndexEntry[];
  try {
    const response = await fetch(`${SONGS_URL}/index.json`);
    entries = await response.json();
  } catch (error) {
    console.error("Cannot load the song index", error);
    return [];
  }

  return entries.flatMap((entry) => {
    const [groupFolder, scaleFolder] = entry.path.split("/");
    const found = findScale(groupFolder, scaleFolder);
    if (!found) {
      console.warn("No scale matches the song folder", entry.path);
      return [];
    }
    const url = `${SONGS_URL}/${entry.path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    const fileName = entry.path.split("/").pop() ?? entry.path;
    return [
      {
        id: `builtin:${entry.path}`,
        band: entry.band,
        title: entry.title,
        ...found,
        isUserSong: false,
        load: async () => {
          const response = await fetch(url);
          return readSong(await response.arrayBuffer(), fileName, "gp");
        },
      },
    ];
  });
};

const toUserExample = (record: UserSongRecord): Example => ({
  id: `user:${record.id}`,
  band: record.band,
  title: record.title,
  scaleGroup: record.scaleGroup,
  scale: record.scale,
  isUserSong: true,
  load: async () => ({
    ...(await readSong(record.bytes, record.fileName, record.format)),
    root: record.root,
  }),
});

let examples: Example[] | undefined;
let loadingExamples: Promise<Example[]> | undefined;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export const subscribeToLibrary = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getExamples = async (): Promise<Example[]> => {
  if (examples) {
    return examples;
  }
  loadingExamples ??= (async () => {
    const [builtIn, userRecords] = await Promise.all([
      loadBuiltInExamples(),
      getUserSongs().catch((error) => {
        console.error("Cannot read the uploaded songs", error);
        return [] as UserSongRecord[];
      }),
    ]);
    examples = [...builtIn, ...userRecords.map(toUserExample)];
    return examples;
  })();
  return loadingExamples;
};

export const toExamplesMap = (list: Example[]): ExamplesMap => {
  const map: ExamplesMap = new Map();
  for (const example of list) {
    let scales = map.get(example.scaleGroup);
    if (!scales) {
      scales = new Map();
      map.set(example.scaleGroup, scales);
    }
    scales.set(example.scale, [...(scales.get(example.scale) ?? []), example]);
  }
  return map;
};

const getSongNotes = (song: Song): Note[] =>
  song.tracks.flatMap((track) => [
    ...track.tabNotes.flatMap((tabNote) => {
      const string = track.tuning?.[tabNote.string];
      return string
        ? [((string.note + tabNote.fret) % NOTE_COUNT) as Note]
        : [];
    }),
    ...track.pitchNotes.map((pitchNote) => pitchNote.octaveNote.note),
    ...track.chords.flatMap((chord) =>
      chord.name !== undefined
        ? [parseChordNoteAndAlterations(chord.name).chordBaseNote]
        : chord.notes?.map((note) => note.note) ?? []
    ),
  ]);

const getScaleSize = (scale: ScaleAndGroup) =>
  scalesMap.get(scale.group)?.get(scale.scale)?.length ?? NOTE_COUNT;

export const detectSongScale = (song: Song): ScaleAndGroup => {
  const markers = initNotesArray<DistinctNoteMarker>();
  for (const note of getSongNotes(song)) {
    if (note !== undefined) {
      markers[note] = 1;
    }
  }
  let detected: ScaleAndGroup | undefined;
  scaleDetector.findMatches(
    markers,
    markers.filter((marker) => marker !== undefined).length,
    (result) => {
      // the smallest scale that holds every note fits the song best
      detected = result.scales?.reduce<ScaleAndGroup | undefined>(
        (best, scale) =>
          !best || getScaleSize(scale) < getScaleSize(best) ? scale : best,
        undefined
      );
    }
  );
  return detected ?? { group: SPECIAL, scale: CHROMATIC, note: Note.E };
};

export const addUserSongs = async (files: File[]): Promise<Example[]> => {
  const list = await getExamples();
  const added: Example[] = [];
  for (const file of files) {
    const format = getSongFormat(file.name);
    if (!format) {
      throw new Error(`${file.name} is not a Guitar Pro or MIDI file`);
    }
    const bytes = await file.arrayBuffer();
    const song = await readSong(bytes, file.name, format);
    const scale = detectSongScale(song);
    const record: UserSongRecord = {
      id: uuidv4(),
      fileName: file.name,
      format,
      bytes,
      band: song.band,
      title: song.title,
      scaleGroup: scale.group,
      scale: scale.scale,
      root: scale.note,
      addedAt: Date.now(),
    };
    await saveUserSong(record);
    const example = toUserExample(record);
    list.push(example);
    added.push(example);
  }
  notify();
  return added;
};

export const removeUserSong = async (example: Example) => {
  if (!example.isUserSong) {
    return;
  }
  await deleteUserSong(example.id.replace(/^user:/, ""));
  const list = await getExamples();
  const index = list.indexOf(example);
  if (index !== -1) {
    list.splice(index, 1);
  }
  notify();
};

// The upload button asks the play button to play a song it just added
export const songPlayRequests = new Subject<Example>();

const getRandomRecord = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];

let lastExample: Example | undefined;

export const wipeExamplesCache = () => {
  console.log("Wiping example cache");
  examples?.forEach((example) => {
    example.decodedTracks = undefined;
  });
};

export const getScaleExample = async (
  scaleGroup: string,
  scale: string,
  chosen?: Example
): Promise<Example | undefined> => {
  const candidates = (await getExamples()).filter(
    (example) => example.scaleGroup === scaleGroup && example.scale === scale
  );
  if (!candidates.length) {
    return undefined;
  }
  const match =
    chosen && candidates.find((example) => example.id === chosen.id);
  if (match) {
    lastExample = match;
  } else {
    const others =
      candidates.length > 1
        ? candidates.filter((example) => example !== lastExample)
        : candidates;
    lastExample = getRandomRecord(others);
  }
  lastExample.song ??= await lastExample.load();
  return lastExample;
};

// The events a song decodes to, so a piano roll edit finds its song
const exampleByEvents = new WeakMap<EventsByTick, Example>();

export const bindExampleEvents = (example: Example, events: EventsByTick) => {
  exampleByEvents.set(events, example);
};

export const getExampleForEvents = (events: EventsByTick | undefined) =>
  events ? exampleByEvents.get(events) : undefined;

// An edit to an uploaded song updates it. An edit to a built-in song saves an own copy
const saveEdits = async (events: EventsByTick) => {
  const example = exampleByEvents.get(events);
  if (!example) {
    return;
  }
  const { eventsToSong, getSongFileName, songToGuitarPro } = await import(
    "@/app/engine/songs/songExport"
  );
  const list = await getExamples();
  const isCopy = !example.isUserSong;
  const song = eventsToSong(events, example);
  const bytes = await songToGuitarPro(song);
  const record: UserSongRecord = {
    id: isCopy ? uuidv4() : example.id.replace(/^user:/, ""),
    fileName: getSongFileName(song),
    format: "gp",
    bytes: bytes.slice().buffer,
    band: song.band,
    title: song.title,
    scaleGroup: example.scaleGroup,
    scale: example.scale,
    root: song.root,
    addedAt: Date.now(),
  };
  await saveUserSong(record);

  const saved = toUserExample(record);
  saved.song = song;
  saved.decodedTracks = events;
  exampleByEvents.set(events, saved);
  const index = list.indexOf(example);
  if (isCopy) {
    // the built-in song plays from its file again
    example.decodedTracks = undefined;
    list.push(saved);
    store.dispatch(
      setAndShowAlert({
        message: `Saved your edits as ${getExampleName(saved)}`,
        alertType: AlertType.Success,
      })
    );
  } else if (index !== -1) {
    list[index] = saved;
  }
  notify();
};

let saving = Promise.resolve();
pianoRollEdits$.pipe(debounceTime(1000)).subscribe((events) => {
  saving = saving
    .then(() => saveEdits(events))
    .catch((error) => console.error("Cannot save the edited song", error));
});
