import {
  getTicksForTimeSignature,
  TimeSignature,
} from "@/app/data/clockConstants";

// the settings slice keeps these in step, so the recorders don't load the store
let quantizeTicks = getTicksForTimeSignature(TimeSignature.SIXTEENTH);
let autoQuantize = false;

export const setRecordQuantize = (
  quantize: TimeSignature,
  isAutoQuantizeOn: boolean,
) => {
  quantizeTicks = getTicksForTimeSignature(quantize);
  autoQuantize = isAutoQuantizeOn;
};

/**
 * With auto quantize on, moves a tick to the nearest quantize line. Ticks count from a bar line
 */
export const quantizeRecordedTick = (tick: number) =>
  autoQuantize ? Math.round(tick / quantizeTicks) * quantizeTicks : tick;
