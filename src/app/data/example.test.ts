import { matchesExampleSearch } from "./example";

const song = {
  band: "Deep Purple",
  title: "Smoke on the Water",
  scale: "Minor",
  scaleGroup: "G",
};

describe("matchesExampleSearch", () => {
  it("matches every song on an empty query", () => {
    expect(matchesExampleSearch(song, "  ")).toBe(true);
  });

  it("matches words in any order and case", () => {
    expect(matchesExampleSearch(song, "water PURPLE")).toBe(true);
  });

  it("matches the scale", () => {
    expect(matchesExampleSearch(song, "smoke minor")).toBe(true);
  });

  it("rejects a query with a missing word", () => {
    expect(matchesExampleSearch(song, "smoke fire")).toBe(false);
  });
});
