import { EventForTick, EventsByTick } from "@/app/engine/eventsByTick";
import { getEditHistory } from "@/app/engine/pianoRoll/editHistory";
import { EditResult } from "@/app/engine/pianoRoll/operations";
import { pianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface PianoRollContextType {
  data: EventsByTick | undefined;
  events: EventForTick[];
  selection: ReadonlySet<string>;
  setSelection: (ids: Iterable<string>) => void;
  // runs the edit through the undo history and selects what it returns
  apply: (result: EditResult) => void;
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
  // the events live in a mutable structure, so a counter tells React they changed
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<boolean>(false);
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  const showReplayTrigger = useSettingsSelector((s) => s.showReplayTrigger);

  // pianoRollData is a module variable. showReplayTrigger flips whenever it changes
  const data = useMemo(
    () => (pianoRollExpanded ? pianoRollData : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pianoRollExpanded, showReplayTrigger]
  );

  // a selection belongs to one melody and drops when another one loads
  const [selectionState, setSelectionState] = useState<{
    data: EventsByTick | undefined;
    ids: ReadonlySet<string>;
  }>({ data: undefined, ids: new Set() });
  const selection = useMemo(
    () =>
      selectionState.data === data ? selectionState.ids : new Set<string>(),
    [selectionState, data]
  );

  useEffect(() => {
    if (!pianoRollExpanded) {
      // the piano roll scrolls to the notes again next time it opens
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoaded(false);
    }
  }, [pianoRollExpanded]);

  const events = useMemo(
    () => data?.flatItems ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, version]
  );

  const setSelection = useCallback(
    (ids: Iterable<string>) => {
      setSelectionState({ data, ids: new Set(ids) });
    },
    [data]
  );

  const apply = useCallback(
    ({ command, selection: newSelection }: EditResult) => {
      if (!data || !command) {
        return;
      }
      getEditHistory(data).execute(command);
      setSelectionState({ data, ids: new Set(newSelection) });
      setVersion((v) => v + 1);
    },
    [data]
  );

  const value = useMemo(
    () => ({
      data,
      events,
      selection,
      setSelection,
      apply,
      loaded,
      setLoaded,
    }),
    [data, events, selection, setSelection, apply, loaded]
  );

  return (
    <PianoRollContext.Provider value={value}>
      {children}
    </PianoRollContext.Provider>
  );
};
