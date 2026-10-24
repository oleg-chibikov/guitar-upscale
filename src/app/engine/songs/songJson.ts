// public/songs-json keeps each built-in song as the Song that gpReader makes from it.
// pnpm songs:index writes the files, so the app loads a built-in song without alphaTab
export const SONGS_JSON_DIR = "songs-json";

export const getSongJsonName = (songFileName: string) =>
  songFileName.replace(/\.[^.]+$/, "") + ".json";
