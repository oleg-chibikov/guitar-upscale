// Picks the scale for a song. It imports only types, so the scripts can load it with Node's type stripping.
import type { Scale } from "../../data/scaleDefinitions";

const NOTE_COUNT = 12;

// One bit for each note, counted from the root
export const toNoteMask = (notes: Iterable<number>) => {
  let mask = 0;
  for (const note of Array.from(notes)) {
    mask |= 1 << (((note % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT);
  }
  return mask;
};

const countNotes = (mask: number) => {
  let count = 0;
  for (let rest = mask; rest; rest &= rest - 1) {
    count++;
  }
  return count;
};

// A song fits a scale that holds every note of the song. The smallest such scale wins, a tie goes to the one listed first
export const pickSongScale = (
  noteMask: number,
  scales: Map<string, Map<string, Scale>>,
) => {
  let best: { scaleGroup: string; scale: string; size: number } | undefined;
  for (const [scaleGroup, groupScales] of Array.from(scales.entries())) {
    for (const [scale, intervals] of Array.from(groupScales.entries())) {
      const scaleMask = toNoteMask([0, ...intervals]);
      if ((noteMask & ~scaleMask) !== 0) {
        continue;
      }
      const size = countNotes(scaleMask);
      if (!best || size < best.size) {
        best = { scaleGroup, scale, size };
      }
    }
  }
  return best && { scaleGroup: best.scaleGroup, scale: best.scale };
};
