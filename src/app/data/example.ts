import { EventsByTick } from "@/app/engine/eventsByTick";
import { Instrument } from "./instruments";
import { Tuning } from "./tunings";

export type Example = {
  band: string;
  title: string;
  tracks: Track[];
  tuning?: Tuning;
  tempo?: number;
  halfBeatShift?: number;
  decodedTracks?: EventsByTick;
};

export type Track = {
  melody: string;
  instrument?: Instrument;
};

export type TrackWithNumber = Track & { trackNumber: number };
