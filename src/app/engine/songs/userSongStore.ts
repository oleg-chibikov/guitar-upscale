import { Note } from "@/app/data/notes";
import { SongFormat } from "@/app/data/song";

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

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const run = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

export const getUserSongs = async (): Promise<UserSongRecord[]> => {
  if (typeof indexedDB === "undefined") {
    return [];
  }
  return run(
    "readonly",
    (store) => store.getAll() as IDBRequest<UserSongRecord[]>,
  );
};

export const saveUserSong = (record: UserSongRecord) =>
  run("readwrite", (store) => store.put(record));

export const deleteUserSong = (id: string) =>
  run("readwrite", (store) => store.delete(id));
