import { EventForTick } from "@/app/engine/eventsByTick";

// shared between tracks, so notes copied from a melody paste into a looper track
let clipboard: EventForTick[] = [];

export const setClipboard = (states: EventForTick[]) => {
  clipboard = states;
};

export const getClipboard = () => clipboard;
