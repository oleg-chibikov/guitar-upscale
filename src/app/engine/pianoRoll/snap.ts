import { Note, NOTE_COUNT } from "@/app/data/notes";
import { clampPitch } from "@/app/engine/pianoRoll/geometry";

export const snapTick = (tick: number, snapTicks: number) =>
  Math.max(0, Math.round(tick / snapTicks) * snapTicks);

export const floorTick = (tick: number, snapTicks: number) =>
  Math.max(0, Math.floor(tick / snapTicks) * snapTicks);

/**
 * Nearest pitch whose note is in the scale. Ties go up.
 */
export const snapPitchToScale = (
  pitch: number,
  scalePattern: Set<Note>
): number => {
  if (scalePattern.size === 0) {
    return pitch;
  }
  for (let distance = 0; distance < NOTE_COUNT; distance++) {
    for (const candidate of [pitch + distance, pitch - distance]) {
      const note = ((candidate % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT;
      if (scalePattern.has(note) && clampPitch(candidate) === candidate) {
        return candidate;
      }
    }
  }
  return pitch;
};
