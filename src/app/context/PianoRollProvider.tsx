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
  loaded: boolean;
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [loaded, setLoaded] = useState<boolean>(false);
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);

  useEffect(() => {
    if (pianoRollExpanded) {
      setNotes(pianoRollData?.items ?? []);
    } else {
      setLoaded(false); // Set loaded to false when pianoRollExpanded is false
      // Nested component will set this value to true when it's loaded
    }
  }, [pianoRollExpanded]);

  const onNoteMove = (
    noteId: string,
    newTick: number,
    newPitch: OctaveNote
  ) => {
    const updated =
      pianoRollData?.changeEvent(noteId, newPitch, newTick) ?? false;
    if (updated) {
      setNotes(pianoRollData?.items ?? []);
    }
  };

  return (
    <PianoRollContext.Provider value={{ notes, onNoteMove, loaded, setLoaded }}>
      {children}
    </PianoRollContext.Provider>
  );
};
