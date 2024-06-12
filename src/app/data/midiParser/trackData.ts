import { Instrument } from "@/app/data/instruments";
import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";

export type TrackData = { instrument?: Instrument; events: NotePlayEvent[] };
