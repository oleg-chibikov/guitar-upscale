import { Note } from "./data/notes";

export const FretCount: number = 12;
export const generateNeckRepresentation = (
  scalePattern: Set<number>,
  stringTuning: Note[],
  baseNote: number
): boolean[][] => {
  const neck: boolean[][] = [];

  for (let i = 0; i < stringTuning.length; i++) {
    const stringModifier: number = FretCount - stringTuning[i];
    neck[i] = [];

    for (let j = 0; j <= FretCount; j++) {
      // Calculate the position on the neck for the current fret and string
      let position: number = (j + stringModifier - baseNote) % FretCount;

      // Ensure position is non-negative
      position = position < 0 ? FretCount + position : position;

      // Check if the position is in the scale pattern
      const isInScale: boolean = scalePattern.has(position);

      // Set 'X' or '-' based on whether the position is in the scale pattern
      neck[i][j] = isInScale;
    }
  }

  return neck;
};
