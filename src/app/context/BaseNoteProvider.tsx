import { Note } from "@/app/data/notes";
import { getShiftedNoteWithCapo } from "@/app/data/scales";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface BaseNoteContextType {
  baseNote: Note;
}

const BaseNoteContext = createContext<BaseNoteContextType | undefined>(
  undefined
);

export const useBaseNoteContext = () => {
  const context = useContext(BaseNoteContext);
  if (context === undefined) {
    throw new Error(
      "useBaseNoteContext must be used within a BaseNoteProvider"
    );
  }
  return context;
};

interface BaseNoteProviderProps {
  children: ReactNode;
}

export const BaseNoteProvider: React.FC<BaseNoteProviderProps> = ({
  children,
}) => {
  const capo = useSettingsSelector((s) => s.capo);
  const tuning = useSettingsSelector((s) => s.tuning);
  const [baseNote, setBaseNote] = useState<Note>(Note.C);

  useEffect(() => {
    const shiftedNote = getShiftedNoteWithCapo(Note.C);
    setBaseNote(shiftedNote);
  }, [capo, tuning]);

  return (
    <BaseNoteContext.Provider value={{ baseNote }}>
      {children}
    </BaseNoteContext.Provider>
  );
};
