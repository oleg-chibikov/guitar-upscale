const MILLISECONDS_PER_MINUTE = 60_000;
const MICROSECONDS_PER_MINUTE = MILLISECONDS_PER_MINUTE * 1000;

export const bpmToMilliseconds = (bpm: number): number => 60_000 / bpm / 2;

export const microsecondsToBpm = (microsecondsPerBeat: number): number =>
  Math.floor(MICROSECONDS_PER_MINUTE / microsecondsPerBeat);

export const beatToMilliseconds = (bpm: number): number =>
  bpmToMilliseconds(bpm) * 4;
