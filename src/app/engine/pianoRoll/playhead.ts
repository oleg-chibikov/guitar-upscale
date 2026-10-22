import { EventsByTick } from "@/app/engine/eventsByTick";
import { BehaviorSubject } from "rxjs";

// the melody tick under the playhead. The piano roll draws its line from it
export const playheadTick$ = new BehaviorSubject<number>(0);

let startTick = 0;
let startData: EventsByTick | undefined;
let pendingSeek: number | undefined;

/**
 * Where playback of this melody starts. A new melody starts at its beginning.
 */
export const getStartTick = (data: EventsByTick) =>
  data === startData ? startTick : 0;

export const publishPlayhead = (tick: number) => {
  if (playheadTick$.value !== tick) {
    playheadTick$.next(tick);
  }
};

// playback stopped: the playhead goes back to where playback started, as in Cubase
export const returnToStart = (data: EventsByTick) => {
  publishPlayhead(getStartTick(data));
};

export const resetPlayhead = (data: EventsByTick | undefined) => {
  if (data !== startData) {
    startData = data;
    startTick = 0;
    pendingSeek = undefined;
    publishPlayhead(0);
  }
};

/**
 * Moves the playhead. A running player jumps there on its next tick.
 */
export const seek = (data: EventsByTick, tick: number, isPlaying: boolean) => {
  const target = Math.max(0, Math.round(tick));
  startData = data;
  startTick = target;
  pendingSeek = isPlaying ? target : undefined;
  publishPlayhead(target);
};

export const takePendingSeek = (): number | undefined => {
  const tick = pendingSeek;
  pendingSeek = undefined;
  return tick;
};
