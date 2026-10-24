import fs from "fs";
import path from "path";
import { readGuitarProSong } from "./gpReader";
import { SONGS_JSON_DIR, getSongJsonName } from "./songJson";

const SONGS_DIR = "public/songs";
const songFiles: string[] = JSON.parse(
  fs.readFileSync(path.join(SONGS_DIR, "index.json"), "utf8"),
).map((entry: { path: string }) => entry.path);

// A stale file means a song changed without pnpm songs:index
describe("public/songs-json", () => {
  it.each(songFiles)("matches what gpReader reads from %s", async (name) => {
    const song = await readGuitarProSong(
      new Uint8Array(fs.readFileSync(path.join(SONGS_DIR, name))),
      name,
    );
    const saved = JSON.parse(
      fs.readFileSync(
        path.join("public", SONGS_JSON_DIR, getSongJsonName(name)),
        "utf8",
      ),
    );

    expect(saved).toStrictEqual(JSON.parse(JSON.stringify(song)));
  });
});
