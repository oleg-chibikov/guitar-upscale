import { Theme } from "@/app/data/theme";

// Canvas can't read Tailwind classes, so these mirror the colors in globals.css
const light = {
  secondary: "#F6E7D2",
  previousFretMarker: "#333333",
  previousFretMarkerMatch: "#4E342E",
  fretMarkerMatch: "#D2A179",
  fretMarker: "#F6E7D2",
  button: "#D2A179",
  buttonPressed: "#F9C2A8",
  foreground: "#2E1F1B",
  background: "#FDF6F1",
  border: "#8D6E63",
  chordDetection: "#8D6E63",
  chordDetectionGlow: "#F6E7D2",
  scaleDetection: "#9B3320",
  scaleDetectionGlow: "#9B3320",
  accent: "#D48CA7",
  accentStronger: "#B8505C",
  accentStrongest: "#9B3320",
  disabled: "#dadada",
  disabledMatch: "#8a8888",
  notePress: "rgb(235, 188, 102)",
  // amber, slate, violet, fuchsia, pink, rose 400
  tracks: ["#fbbf24", "#94a3b8", "#a78bfa", "#e879f9", "#f472b6", "#fb7185"],
};

export type Palette = typeof light;

const dark: Palette = {
  secondary: "#1d3f58",
  previousFretMarker: "#b3cde4",
  previousFretMarkerMatch: "#a2cef5",
  fretMarkerMatch: "#1d3f58",
  fretMarker: "#537692",
  button: "#537692",
  buttonPressed: "#849db3",
  foreground: "#F2F2F2",
  background: "#001b2e",
  border: "#999999",
  chordDetection: "#F2F2F2",
  chordDetectionGlow: "#a2cef5",
  scaleDetection: "#001b2e",
  scaleDetectionGlow: "#B103BC",
  accent: "#9567DB",
  accentStronger: "#9932CC",
  accentStrongest: "#B103BC",
  disabled: "#8c8c8c",
  disabledMatch: "#5c5c5c",
  notePress: "rgb(99, 9, 245)",
  // sky, teal, emerald, indigo, cyan, purple 600
  tracks: ["#0284c7", "#0d9488", "#059669", "#4f46e5", "#0891b2", "#9333ea"],
};

export const getPalette = (theme: Theme): Palette =>
  theme === Theme.Light ? light : dark;

export const RED_500 = "#ef4444";
export const GRAY_500 = "#6b7280";

// MUI's button typography, which the DOM markers used
export const BUTTON_FONT_FAMILY = "Roboto, Helvetica, Arial, sans-serif";
export const BUTTON_FONT_STYLE = "500";

export const mixColors = (from: string, to: string, amount: number) => {
  const a = parseColor(from);
  const b = parseColor(to);
  const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * amount);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
};

const parseColor = (color: string): [number, number, number] => {
  if (color.startsWith("#")) {
    const value = parseInt(color.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const [r, g, b] = color.match(/\d+/g)!.map(Number);
  return [r, g, b];
};
