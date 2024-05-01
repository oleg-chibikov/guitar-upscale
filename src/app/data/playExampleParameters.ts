import { Neck } from "../engine/generateNeckRepresentation";
import { Example } from "./example";
import { Note, OctaveNote } from "./notes";

export type PlayExampleParameters = {
  baseNote: Note;
  example: Example;
  waitNote: () => Promise<void>;
  neck: Neck;
  tuning: OctaveNote[];
  showAlert: (message: string) => void;
};
