import { Neck } from "@/app/engine/generateNeckRepresentation";
import { Example } from "./example";

export type PlayExampleParameters = {
  example: Example;
  waitNote: () => Promise<void>;
  neck: Neck;
  showAlert: (message: string) => void;
};
