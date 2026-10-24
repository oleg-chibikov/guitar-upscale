import { Note } from "@/app/data/notes";
import { SongFormat } from "@/app/data/song";
import { DBSchema, openDB } from "idb";

export type UserSongRecord = {
  id: string;
  fileName: string;
  format: SongFormat;
  bytes: ArrayBuffer;
  band: string;
  title: string;
  scaleGroup: string;
  scale: string;
  root: Note;
  addedAt: number;
};

const DB_NAME = "guitar-upscale-songs";
const STORE = "songs";

interface SongsDb extends DBSchema {
  [STORE]: { key: string; value: UserSongRecord };
}

const openDb = () =>
  openDB<SongsDb>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: "id" });
    },
  });

let dbPromise: ReturnType<typeof openDb> | undefined;

const getDb = () => (dbPromise ??= openDb());

export const getUserSongs = async (): Promise<UserSongRecord[]> => {
  if (typeof indexedDB === "undefined") {
    return [];
  }
  return (await getDb()).getAll(STORE);
};

export const saveUserSong = async (record: UserSongRecord) =>
  (await getDb()).put(STORE, record);

export const getUserSong = async (id: string) => (await getDb()).get(STORE, id);

export const deleteUserSong = async (id: string) =>
  (await getDb()).delete(STORE, id);
