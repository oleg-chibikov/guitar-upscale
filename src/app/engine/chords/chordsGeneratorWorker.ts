import { chordsGenerator } from "@/app/engine/chords/chordsGenerator";

self.onmessage = (event) => {
  const { neck, useAdvancedChords, capo } = event.data;

  chordsGenerator.processInWorker(neck, useAdvancedChords, capo);
};
