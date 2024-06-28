export const BEATS_IN_BAR = 4;
export const TICKS_IN_HALF_BEAT = 8; // main setting affecting granularity (how many ticks in beat/bar etc) // 8 means 64 ticks in a bar
export const TICKS_IN_BEAT = TICKS_IN_HALF_BEAT * 2;
export const HALF_BEATS_IN_BAR = BEATS_IN_BAR * 2;
export const TICKS_IN_BAR = BEATS_IN_BAR * TICKS_IN_BEAT;
export const TICKS_IN_HALF_BAR = TICKS_IN_BAR / 2;
export const TICKS_PER_SIXTEENTH = TICKS_IN_BAR / 16;
export const TICKS_PER_THIRTY_SECOND = TICKS_IN_BAR / 32;
export const TICKS_PER_SIXTY_FOURTH = TICKS_IN_BAR / 64;

console.log("Ticks in bar", TICKS_IN_BAR);
