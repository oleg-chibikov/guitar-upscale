export function isWithinAllowedDistance(
  leftFingerFret: number,
  rightFingerFret: number,
  leftFinger: number,
  rightFinger: number
): boolean {
  validateFingers(leftFinger, rightFinger);

  let maxStretch: number;
  if (Math.abs(leftFinger - rightFinger) === 1) {
    maxStretch = getAdjacentFingerStretch(
      leftFinger,
      rightFinger,
      leftFingerFret
    );
  } else {
    maxStretch = getNonAdjacentFingerStretch(
      leftFinger,
      rightFinger,
      leftFingerFret
    );
  }

  const allowedDistance = Math.abs(rightFingerFret - leftFingerFret);
  return allowedDistance <= maxStretch;
}

export const getPossibleFullFingerStretch = (leftFingerFret: number) =>
  getNonAdjacentFingerStretch(0, 3, leftFingerFret);

// Get the maximum stretch for non-adjacent fingers
function getNonAdjacentFingerStretch(
  leftFinger: number,
  rightFinger: number,
  leftFingerFret: number
): number {
  if (leftFinger === 0 && rightFinger === 2) {
    return getMaxStretchForIndexFinger(leftFingerFret) + 2;
  }
  if (leftFinger === 0 && rightFinger === 3) {
    return getMaxStretchForIndexFinger(leftFingerFret) + 3;
  }
  if (leftFinger === 1 && rightFinger === 3) {
    return 4;
  }
  return 0; // This case shouldn't happen due to the previous validation
}

// Get the maximum stretch between adjacent fingers
function getAdjacentFingerStretch(
  leftFinger: number,
  rightFinger: number,
  fret: number
): number {
  if (leftFinger === 0 && rightFinger === 1) {
    return getMaxStretchForIndexFinger(fret);
  }
  return 2; // for all the other fingers it's max 2 frets at any position
}

// Determine the maximum stretch capabilities based on fret positions
function getMaxStretchForIndexFinger(fret: number): number {
  if (fret >= 1 && fret <= 2) {
    return 2;
  } else if (fret >= 3 && fret <= 7) {
    return 3;
  } else if (fret >= 8) {
    return 4;
  }
  return 2; // Default stretch if not found in predefined ranges
}

// Ensure valid finger numbers (0-3)
function validateFingers(leftFinger: number, rightFinger: number): void {
  if (leftFinger < 0 || leftFinger > 3 || rightFinger < 0 || rightFinger > 3) {
    throw new Error("Finger numbers must be between 0 and 3.");
  }
  if (leftFinger === rightFinger) {
    throw new Error("Left and right fingers must be different.");
  }
}
