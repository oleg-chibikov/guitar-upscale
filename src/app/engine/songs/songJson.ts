// songs-json/<name>.json serves each built-in song as the Song that gpReader makes from it,
// so the app loads a built-in song without alphaTab. src/app/songs-json/[name]/route.ts builds it
export const SONGS_JSON_DIR = "songs-json";

export const getSongJsonName = (songFileName: string) =>
  songFileName.replace(/\.[^.]+$/, "") + ".json";
