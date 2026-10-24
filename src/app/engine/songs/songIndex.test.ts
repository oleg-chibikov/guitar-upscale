import { scalesMap } from "@/app/data/scaleDefinitions";
import { getSongJsonName } from "./songJson";
import {
  buildSongIndex,
  findSongFileByJsonName,
  listSongFiles,
} from "./songIndex";

describe("songIndex", () => {
  it("lists each file in public/songs with a known scale", async () => {
    const index = await buildSongIndex();

    expect(index.map((entry) => entry.path)).toEqual(listSongFiles());
    for (const entry of index) {
      expect(scalesMap.get(entry.scaleGroup)?.has(entry.scale)).toBe(true);
    }
  });

  it("finds a song file by its JSON name", () => {
    const [name] = listSongFiles();

    expect(findSongFileByJsonName(getSongJsonName(name))).toBe(name);
    expect(findSongFileByJsonName("missing.json")).toBeUndefined();
  });
});
