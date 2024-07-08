import { OctaveNote } from "@/app/data/notes";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { pianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useUiSelector } from "@/app/hooks/storeHooks";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface PianoRollContextType {
  notes: { tick: number; events: ChordOrNote[] }[];
  onNoteMove: (noteId: string, newTick: number, newPitch: OctaveNote) => void;
}

const PianoRollContext = createContext<PianoRollContextType | undefined>(
  undefined
);

export const usePianoRoll = () => {
  const context = useContext(PianoRollContext);
  if (context === undefined) {
    throw new Error("usePianoRoll must be used within a PianoRollProvider");
  }
  return context;
};

interface PianoRollProviderProps {
  children: ReactNode;
}

export const PianoRollProvider: React.FC<PianoRollProviderProps> = ({
  children,
}) => {
  const [notes, setNotes] = useState<{ tick: number; events: ChordOrNote[] }[]>(
    []
  );
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);

  useEffect(() => {
    if (pianoRollExpanded) {
      setNotes(pianoRollData?.items ?? []);
    }
  }, [pianoRollExpanded]);

  const onNoteMove = (
    noteId: string,
    newTick: number,
    newPitch: OctaveNote
  ) => {
    pianoRollData?.changeEvent(noteId, newPitch, newTick);
    setNotes(pianoRollData?.items ?? []);
  };

  return (
    <PianoRollContext.Provider value={{ notes, onNoteMove }}>
      {children}
    </PianoRollContext.Provider>
  );
};
