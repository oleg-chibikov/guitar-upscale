import { CHROMATIC } from "@/app/data/scaleDefinitions";
import { Note } from "@/app/data/notes";
import { describeKey } from "./keyDescription";

describe("describeKey", () => {
  it("puts the root and the style on top, the scale and tuning below", () => {
    expect(
      describeKey({
        root: Note.E,
        scaleGroup: "Minor",
        scale: "Aeolian / Natural",
        tuningName: "E standard",
        capo: 0,
      }),
    ).toEqual({
      title: "E Minor",
      details: "Aeolian / Natural · E standard",
    });
  });

  it("adds the capo when it is on", () => {
    expect(
      describeKey({
        root: Note.G,
        scaleGroup: "Minor",
        scale: "Dorian",
        tuningName: "E standard",
        capo: 3,
      }).details,
    ).toBe("Dorian · E standard · Capo 3");
  });

  it("drops the root for the chromatic scale", () => {
    expect(
      describeKey({
        root: Note.E,
        scaleGroup: "Special",
        scale: CHROMATIC,
        tuningName: "E standard",
        capo: 0,
      }),
    ).toEqual({ title: "All notes", details: "E standard" });
  });
});
