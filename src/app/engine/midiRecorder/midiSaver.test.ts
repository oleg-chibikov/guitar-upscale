import { getProgramForInstrument } from "@/app/data/instruments";
import Midi from "midi-writer-js";
import { read } from "midifile-ts";
import { getTrackChannel, midiSaver } from "./midiSaver";

jest.mock("../../store/settingsSlice", () => ({
  capoValue: 0,
  scaleGroupValue: "Major",
  scaleValue: "Ionian",
  tempoBpmValue: 120,
}));

describe("getTrackChannel", () => {
  it("gives each track its own channel and skips the drum channel", () => {
    const channels = Array.from({ length: 15 }, (_, i) => getTrackChannel(i));
    expect(channels).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16,
    ]);
    expect(getTrackChannel(15)).toBe(1);
  });
});

describe("midiSaver", () => {
  it("writes each track's instrument on its own channel", async () => {
    const note = () =>
      new Midi.NoteEvent({ pitch: [60], duration: "8", channel: 1, tick: 8 });
    const file = midiSaver.getMidiFile(
      new Map([
        ["distortion_guitar|0", [note()]],
        ["electric_bass_finger|1", [note()]],
      ]),
    );
    const midi = read(new Uint8Array(await file.arrayBuffer()));
    const channelEvents = midi.tracks.map((track) =>
      track.flatMap((event) => (event.type === "channel" ? [event] : [])),
    );

    expect(
      channelEvents.map((events) =>
        events.flatMap((event) =>
          event.subtype === "programChange" ? [event.value] : [],
        ),
      ),
    ).toEqual([
      [getProgramForInstrument("distortion_guitar")],
      [getProgramForInstrument("electric_bass_finger")],
    ]);
    expect(
      channelEvents.map((events) => new Set(events.map((e) => e.channel))),
    ).toEqual([new Set([0]), new Set([1])]);
  });
});
