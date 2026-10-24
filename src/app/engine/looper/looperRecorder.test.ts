import { TimeSignature, TICKS_IN_BAR as B } from "@/app/data/clockConstants";
import { setRecordQuantize } from "@/app/engine/recordQuantize";
import { LooperRecorder } from "./looperRecorder";

const clock = {
  currentTick: 0,
  globalCurrentTick: 0,
  globalCurrentLastBarTick: 0,
};

jest.mock("../clock/mainClock", () => ({
  get currentTick() {
    return clock.currentTick;
  },
  get globalCurrentTick() {
    return clock.globalCurrentTick;
  },
  get globalCurrentLastBarTick() {
    return clock.globalCurrentLastBarTick;
  },
}));
jest.mock("@/app/engine/looper/looperShared", () => ({
  currentlyRecordingLooperChannel: 0,
}));
jest.mock("@/app/engine/playerHelper", () => ({}));
jest.mock("@/app/engine/pianoRoll/soloTrack", () => ({}));
let nextId = 0;
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => `${prefix}${nextId++}` },
}));

const moveClockTo = (globalTick: number) => {
  clock.globalCurrentTick = globalTick;
  clock.globalCurrentLastBarTick = globalTick - (globalTick % B);
  clock.currentTick = globalTick % B;
};

const record = (globalTicks: number[], stopAt: number) => {
  const recorder = new LooperRecorder();
  recorder.startRecording();
  for (const globalTick of globalTicks) {
    moveClockTo(globalTick);
    recorder.recordNote(
      { note: 0, octave: 4, string: 0, fret: 0 },
      0,
      "acoustic_guitar_nylon",
    );
  }
  moveClockTo(stopAt);
  recorder.stopRecording();
  return {
    ticks: recorder.items!.items.map(({ tick }) => tick),
    loopLengthTicks: recorder.loopLengthTicks,
  };
};

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => setRecordQuantize(TimeSignature.SIXTEENTH, false));

describe("LooperRecorder quantize", () => {
  it("keeps the played ticks with auto quantize off", () => {
    expect(record([B + 7, B + 25], 2 * B + 40).ticks).toEqual([7, 25]);
  });

  it("moves the notes to the nearest quantize line", () => {
    setRecordQuantize(TimeSignature.ONE_BEAT, true);
    expect(record([B + 7, B + 25], 2 * B + 40)).toEqual({
      ticks: [0, 32],
      loopLengthTicks: 2 * B,
    });
  });

  it("puts a note quantized onto the loop end at the loop start", () => {
    setRecordQuantize(TimeSignature.ONE_BAR, true);
    expect(record([B + 2, B + 50], 2 * B + 3)).toEqual({
      ticks: [0],
      loopLengthTicks: B,
    });
  });
});
