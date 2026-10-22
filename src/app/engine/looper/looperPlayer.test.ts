import { TICKS_IN_BAR as B } from "@/app/data/clockConstants";
import { getLoopLengthTicks, LooperPlayer } from "./looperPlayer";

const clock = {
  globalCurrentTick: 0,
  globalCurrentLastBarTick: 0,
  isMainClockActiveValue: true,
};

// Mirrors onTick in mainClock: a bar starts every B ticks
const tick = () => {
  if (clock.globalCurrentTick % B === 0) {
    clock.globalCurrentLastBarTick = clock.globalCurrentTick;
  }
  clock.globalCurrentTick++;
};

jest.mock("@/app/engine/eventsByTick", () => ({}));
jest.mock("../clock/mainClock", () => ({
  get globalCurrentTick() {
    return clock.globalCurrentTick;
  },
  get globalCurrentLastBarTick() {
    return clock.globalCurrentLastBarTick;
  },
  get isMainClockActiveValue() {
    return clock.isMainClockActiveValue;
  },
  waitForNextTick: async () => tick(),
}));

const played: number[] = [];
jest.mock("@/app/engine/playerHelper", () => ({
  playAllNotes: () => played.push(clock.globalCurrentTick),
}));

const play = async (
  ticks: number[],
  loopLengthTicks: number,
  count: number
) => {
  const player = new LooperPlayer({
    eventsByTick: {
      items: ticks.map((t) => ({ tick: t, events: [] })),
    } as never,
    loopLengthTicks,
  });
  const loop = player.playLoop();
  while (played.length < count) {
    await Promise.resolve();
  }
  player.stopPlaying();
  await loop;
  return played.slice(0, count);
};

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  clock.globalCurrentTick = 0;
  clock.globalCurrentLastBarTick = 0;
  clock.isMainClockActiveValue = true;
  played.length = 0;
});

describe("LooperPlayer", () => {
  it("keeps a 2-bar loop when the last event sits earlier in its bar than the first", async () => {
    // C on beat 3 of bar 1, G on beat 1 of bar 2
    const result = await play([B / 2, B + 1], 2 * B, 4);

    expect(result).toEqual([B / 2, B + 1, 2 * B + B / 2, 3 * B + 1]);
  });

  it("starts in the next bar when the first event's position has passed", async () => {
    for (let i = 0; i < B / 2 + 5; i++) tick();

    const result = await play([B / 2], B, 2);

    expect(result).toEqual([B + B / 2, 2 * B + B / 2]);
  });

  it("skips events past the loop end", async () => {
    const result = await play([1, B + 1], B, 2);

    expect(result).toEqual([1, B + 1]);
  });

  it("waits out a pass after the piano roll deletes every note", async () => {
    const items = [{ tick: 1, events: [] }];
    const player = new LooperPlayer({
      eventsByTick: {
        get items() {
          return items;
        },
      } as never,
      loopLengthTicks: B,
    });
    const loop = player.playLoop();
    while (played.length < 1) await Promise.resolve();
    items.length = 0;
    // a spinning loop would never let the clock reach the next bars
    while (clock.globalCurrentTick < 3 * B) await Promise.resolve();
    player.stopPlaying();
    await loop;
    // the pass that read the note before the delete still plays it
    expect(played).toEqual([1, B + 1]);
  });

  it("stops when the clock is stopped", async () => {
    clock.isMainClockActiveValue = false;
    const player = new LooperPlayer({
      eventsByTick: { items: [{ tick: B, events: [] }] } as never,
      loopLengthTicks: B,
    });

    await player.playLoop();

    expect(played).toEqual([]);
  });
});

describe("getLoopLengthTicks", () => {
  it("keeps the bar where recording stopped in its second half", () => {
    expect(getLoopLengthTicks(B, false)).toBe(2 * B);
  });

  it("drops the bar where recording stopped in its first half", () => {
    expect(getLoopLengthTicks(B, true)).toBe(B);
  });

  it("is at least one bar", () => {
    expect(getLoopLengthTicks(0, true)).toBe(B);
    expect(getLoopLengthTicks(-B, false)).toBe(B);
  });
});
