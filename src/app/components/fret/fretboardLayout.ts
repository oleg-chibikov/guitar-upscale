import { NOTE_COUNT } from "@/app/data/notes";
import { StringTilt } from "@/app/helpers/skinHelper";

// Each fret is narrower than the one before it by this factor
const WIDTH_FACTOR = 1.06;
// The gap between the header row and the first string
export const HEADER_GAP = 40;
export const HEADER_CELL_HEIGHT = 36;
export const FRET_LINE_HEIGHT = 20;
export const FRET_LINE_WIDTH = 2;
export const MARKER_RADIUS = 14;
// Each note keeps a clickable box this tall around its centre
export const CLICK_AREA_HEIGHT = 36;

export interface FretColumn {
  fret: number;
  left: number;
  width: number;
  centerX: number;
  // where the string tilt is measured from
  tiltX: number;
}

export interface FretboardLayout {
  rowHeight: number;
  columns: FretColumn[];
  width: number;
  height: number;
  headerCenterY: number;
  getStringCenterY: (string: number, fret: number) => number;
}

/**
 * Positions of frets and strings in px, before the aspect ratio sliders scale them.
 * Fret 0 sits at x 0, the top of the fret number row at y 0.
 */
export const getFretboardLayout = (
  fretCount: number,
  stringCount: number,
  widthStep: number,
  rowHeight: number,
  stringTilt: StringTilt
): FretboardLayout => {
  const initialWidth = (NOTE_COUNT + 1) * widthStep;
  const columns: FretColumn[] = [];
  for (let fret = 0; fret <= fretCount; fret++) {
    const width = initialWidth / Math.pow(WIDTH_FACTOR, fret);
    // the frets before this one sum up as a geometric series
    const left =
      (initialWidth * (1 - Math.pow(WIDTH_FACTOR, -fret))) /
      (1 - 1 / WIDTH_FACTOR);
    // every fret but the first has a fret line on its left edge
    const lineWidth = fret > 0 ? FRET_LINE_WIDTH : 0;
    columns.push({
      fret,
      left,
      width,
      centerX: left + lineWidth + (width - lineWidth) / 2,
      tiltX: left + (width - initialWidth) / 2,
    });
  }
  const last = columns[columns.length - 1];
  const firstStringTop = rowHeight + HEADER_GAP;

  return {
    rowHeight,
    columns,
    width: last.left + last.width,
    height: firstStringTop + stringCount * rowHeight,
    headerCenterY: rowHeight / 2,
    getStringCenterY: (string, fret) =>
      firstStringTop +
      string * rowHeight +
      rowHeight / 2 +
      columns[fret].tiltX * stringTilt.slope * (string - stringTilt.center),
  };
};

export type FretHit =
  | { kind: "header"; fret: number }
  | { kind: "note"; string: number; fret: number };

/**
 * Finds the fret number or the note under a point given in layout px.
 * Overlapping click boxes go to the string whose centre is closest.
 */
export const findFretHit = (
  layout: FretboardLayout,
  x: number,
  y: number,
  hasNote: (string: number, fret: number) => boolean,
  stringCount: number
): FretHit | undefined => {
  const column = layout.columns.find(
    ({ left, width }) => x >= left && x < left + width
  );
  if (!column) {
    return undefined;
  }
  if (Math.abs(y - layout.headerCenterY) <= HEADER_CELL_HEIGHT / 2) {
    return { kind: "header", fret: column.fret };
  }
  let best: FretHit | undefined;
  let bestDistance = CLICK_AREA_HEIGHT / 2;
  for (let string = 0; string < stringCount; string++) {
    if (!hasNote(string, column.fret)) {
      continue;
    }
    const distance = Math.abs(y - layout.getStringCenterY(string, column.fret));
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = { kind: "note", string, fret: column.fret };
    }
  }
  return best;
};
