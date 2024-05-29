import { ChordOrNote, LooperNoteEvent } from "@/app/data/looperData";
import { Note, StringOctaveNote } from "@/app/data/notes";
import { ChordEventBus, NotePlayEventBus } from "./eventBus";
import { LooperPlayer, LooperPlayerOptions } from "./looperPlayer";
import {
  getCurrentRelativeTick,
  waitForNextBar,
  waitForNextTick,
} from "./mainClock";

// Mocking external dependencies
jest.mock("./eventBus");
jest.mock("./mainClock");

const mockNote: StringOctaveNote = {
  note: Note.E,
  string: 0,
  octave: 4,
  fret: 0,
};

const mockNoteWrapper: LooperNoteEvent = {
  note: mockNote,
  instrument: "acoustic_guitar_nylon",
  looperChannel: 1,
  trackNumber: 1,
};

const mockChordOrNote: ChordOrNote = {
  note: mockNoteWrapper,
};

describe("LooperPlayer", () => {
  let looperPlayer: LooperPlayer;
  let options: LooperPlayerOptions;
  let eventsByTick: Map<number, Set<ChordOrNote>>;

  beforeEach(() => {
    eventsByTick = new Map();
    options = {
      eventsByTick,
      lastBarTickWhenStoppedRecording: 0,
      lastBarTickForLastRecordedEvent: 0,
      endTick: 0,
      recordingEndedInFurtherBar: false,
      recordingStoppedInTheFirstHalfOfLastBar: false,
    };
    looperPlayer = new LooperPlayer(options);

    // Reset mocks
    (waitForNextBar as jest.Mock).mockReset();
    (waitForNextTick as jest.Mock).mockReset();
    (getCurrentRelativeTick as jest.Mock).mockReset();
    (ChordEventBus.next as jest.Mock).mockReset();
    (NotePlayEventBus.next as jest.Mock).mockReset();
    (getCurrentRelativeTick as jest.Mock).mockReturnValue(0);
    (waitForNextTick as jest.Mock).mockImplementation(() => Promise.resolve());
  });

  test("should start and stop playing loop", async () => {
    const playPromise = looperPlayer.playLoop();
    looperPlayer.stopPlaying();
    await expect(playPromise).resolves.toBeUndefined();
  });

  test("should handle edge case of no notes", async () => {
    await expect(looperPlayer.playLoop()).resolves.toBeUndefined();
  });

  test("should play events at the correct tick", async () => {
    eventsByTick.set(1, new Set([mockChordOrNote]));

    looperPlayer.playLoop();
    await looperPlayer.currentLoopPromise;
    looperPlayer.stopPlaying();

    expect(NotePlayEventBus.next).toHaveBeenCalledWith({
      stringOctaveNote: mockNoteWrapper.note,
      looperChannel: mockNoteWrapper.looperChannel,
      trackInstrument: mockNoteWrapper.instrument,
      trackNumber: mockNoteWrapper.trackNumber,
      skipChordDetection: true,
    });
  });

  test("should handle recordingStoppedInTheFirstHalfOfLastBar correctly", async () => {
    options.lastBarTickWhenStoppedRecording = 4;
    options.recordingStoppedInTheFirstHalfOfLastBar = true;

    eventsByTick.set(1, new Set([mockChordOrNote]));
    eventsByTick.set(5, new Set([mockChordOrNote]));

    looperPlayer.playLoop();
    await looperPlayer.currentLoopPromise;
    looperPlayer.stopPlaying();

    expect(NotePlayEventBus.next).toHaveBeenCalledTimes(1);
  });

  test("should wait for the next bar if needed", async () => {
    eventsByTick.set(10, new Set([mockChordOrNote]));

    (getCurrentRelativeTick as jest.Mock).mockReturnValue(15);

    looperPlayer.playLoop();
    await looperPlayer.currentLoopPromise;
    looperPlayer.stopPlaying();

    expect(waitForNextBar).toHaveBeenCalled();
  });
});
