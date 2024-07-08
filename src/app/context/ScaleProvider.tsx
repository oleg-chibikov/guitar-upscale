import { Note } from "@/app/data/notes";
import { getScalePattern } from "@/app/data/scales";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface ScaleContextType {
  scalePattern: Set<Note>;
}

const ScaleContext = createContext<ScaleContextType | undefined>(undefined);

export const useScaleContext = () => {
  const context = useContext(ScaleContext);
  if (context === undefined) {
    throw new Error("useScaleContext must be used within a ScaleProvider");
  }
  return context;
};

interface ScaleProviderProps {
  children: ReactNode;
}

export const ScaleProvider: React.FC<ScaleProviderProps> = ({ children }) => {
  const scale = useSettingsSelector((s) => s.scale);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const [scalePattern, setScalePattern] = useState<Set<Note>>(new Set<Note>());

  useEffect(() => {
    const pattern = getScalePattern(scaleGroup, scale, true);
    setScalePattern(pattern);
  }, [scale, scaleGroup]);

  return (
    <ScaleContext.Provider value={{ scalePattern }}>
      {children}
    </ScaleContext.Provider>
  );
};
