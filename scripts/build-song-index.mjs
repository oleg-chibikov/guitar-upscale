// Lists the songs in public/songs in public/songs/index.json, so the app knows what to fetch.
// Run it after adding, renaming or removing a song file: pnpm songs:index
import * as alphaTab from "@coderline/alphatab";
import fs from "fs";
import path from "path";

const SONGS_DIR = "public/songs";
const SONG_FILE = /\.(gp|gp3|gp4|gp5|gpx)$/i;

const findSongFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findSongFiles(fullPath);
    }
    return SONG_FILE.test(entry.name) ? [fullPath] : [];
  });

const parseFileName = (fileName) => {
  const name = fileName.replace(/\.[^.]+$/, "");
  const separator = name.indexOf(" - ");
  return separator === -1
    ? { band: "", title: name }
    : { band: name.slice(0, separator).trim(), title: name.slice(separator + 3).trim() };
};

const settings = new alphaTab.Settings();
const entries = findSongFiles(SONGS_DIR)
  .map((file) => {
    const relative = path.relative(SONGS_DIR, file).split(path.sep).join("/");
    if (relative.split("/").length !== 3) {
      console.warn(`Skipping ${relative}: put songs in <Scale group>/<Scale>/<Band> - <Title>.gp`);
      return undefined;
    }
    const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(fs.readFileSync(file)), settings);
    const fromName = parseFileName(path.basename(file));
    return {
      path: relative,
      band: score.artist?.trim() || fromName.band,
      title: score.title?.trim() || fromName.title,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.path.localeCompare(b.path));

fs.writeFileSync(path.join(SONGS_DIR, "index.json"), JSON.stringify(entries, null, 2) + "\n");
console.log(`Listed ${entries.length} songs in ${SONGS_DIR}/index.json`);
