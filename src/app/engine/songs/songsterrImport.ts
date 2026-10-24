import { Example } from "@/app/data/example";
import { CHROMATIC, scalesMap } from "@/app/data/scales";
import { writeGuitarPro } from "@/app/engine/songs/gpWriter";
import { addUserSongs } from "@/app/engine/songs/songLibrary";
import {
  SongsterrConvertResult,
  SongsterrMeta,
  SongsterrSearchResult,
  SongsterrTrack,
  convertSongsterr,
  listScales,
  songsterrTrackUrl,
} from "@/app/engine/songs/songsterr";

const API = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/songsterr`;

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = (body as { error?: { message?: string } } | undefined)
      ?.error?.message;
    throw new Error(message ?? `Songsterr answered ${response.status}`);
  }
  return body as T;
};

export const searchSongsterr = (pattern: string) =>
  getJson<SongsterrSearchResult[]>(
    `${API}/search?pattern=${encodeURIComponent(pattern)}`,
  );

export const loadSongsterrMeta = (songId: number) =>
  getJson<SongsterrMeta>(`${API}/meta?songId=${songId}`);

export const loadSongsterrTrack = (meta: SongsterrMeta, index: number) =>
  getJson<SongsterrTrack>(songsterrTrackUrl(meta, index));

type ImportOptions = {
  meta: SongsterrMeta;
  melodyTrack: SongsterrTrack;
  bassIndex?: number;
};

// Builds a Guitar Pro file from the whole track and adds it to the person's songs.
export const importSongsterrSong = async ({
  meta,
  melodyTrack,
  bassIndex,
}: ImportOptions): Promise<{
  example: Example;
  result: SongsterrConvertResult;
}> => {
  const bassTrack =
    bassIndex === undefined
      ? undefined
      : await loadSongsterrTrack(meta, bassIndex);
  const result = convertSongsterr({
    meta,
    melodyTrack,
    bassTrack,
    from: 0,
    to: melodyTrack.measures.length - 1,
    title: meta.title,
    scales: listScales(scalesMap, CHROMATIC),
  });
  const bytes = await writeGuitarPro(result.song);
  const file = new File(
    [bytes as Uint8Array<ArrayBuffer>],
    `${meta.artist} - ${meta.title}.gp`,
  );
  const [example] = await addUserSongs([file]);
  return { example, result };
};
