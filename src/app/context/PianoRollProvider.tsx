import { OctaveNote } from "@/app/data/notes";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { pianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface PianoRollContextType {
  notes: { tick: number; events: ChordOrNote[] }[];
  onEventMove: (
    eventId: string,
    newTick: number,
    updatedNote: OctaveNote
  ) => void;
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
  const showReplayTrigger = useSettingsSelector((s) => s.showReplayTrigger);

  useEffect(() => {
    if (pianoRollExpanded) {
      setNotes(pianoRollData?.items ?? []);
    } else {
      setLoaded(false); // Set loaded to false when pianoRollExpanded is false
      // Nested component will set this value to true when it's loaded
    }
  }, [pianoRollExpanded, showReplayTrigger]);

  const onEventMove = (
    eventId: string,
    newTick: number,
    updatedNote: OctaveNote
  ) => {
    const data = pianoRollData;
    if (!data) {
      return;
    }
    const updated = data.changeEvent(eventId, updatedNote, newTick);
    if (updated) {
      const items = pianoRollData?.items;
      setNotes(items ?? []);
    }
  };

  return (
    <PianoRollContext.Provider
      value={{ notes, onEventMove, loaded, setLoaded }}
    >
      {children}
    </PianoRollContext.Provider>
  );
};
