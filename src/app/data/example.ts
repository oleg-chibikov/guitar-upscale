import { Instrument } from "./instruments";
import { Tuning } from "./tunings";

export type Example = {
  band: string;
  title: string;
  tracks: Track[];
  tuning?: Tuning;
  tempo?: number;
  halfBeatShift?: number;
};

export type Track = {
  melody: string;
  instrument?: Instrument;
};
