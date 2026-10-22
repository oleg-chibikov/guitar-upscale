import { EventForTick, EventsByTick } from "@/app/engine/eventsByTick";
import { EditCommand } from "@/app/engine/pianoRoll/editCommand";
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
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | undefined;
  redoLabel: string | undefined;
  // the chord waiting for the person to pick its mode
  chordToChoose: string | undefined;
  chooseChordMode: (id: string) => void;
  closeChordChoice: () => void;
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

// after undo or redo the notes it touched stay selected
const affectedIds = (data: EventsByTick, command: EditCommand) =>
  command.changes
    .map((change) => change.id)
    .filter((id) => data.getEvent(id) !== undefined);

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

  const [chordQueue, setChordQueue] = useState<string[]>([]);
  const chordToChoose = chordQueue.find((id) => data?.getEvent(id));
  const chooseChordMode = useCallback((id: string) => {
    setChordQueue((queue) => [id, ...queue.filter((queued) => queued !== id)]);
  }, []);
  const closeChordChoice = useCallback(() => {
    setChordQueue((queue) => queue.slice(1));
  }, []);

  const apply = useCallback(
    ({ command, selection: newSelection, chordsWithChangedMode }: EditResult) => {
      if (!data || !command) {
        return;
      }
      getEditHistory(data).execute(command);
      setSelectionState({ data, ids: new Set(newSelection) });
      setVersion((v) => v + 1);
      if (chordsWithChangedMode.length) {
        // the move picked a stand-in mode. Offer the others
        setChordQueue((queue) => [...queue, ...chordsWithChangedMode]);
      }
    },
    [data]
  );

  const step = useCallback(
    (direction: "undo" | "redo") => {
      if (!data) {
        return;
      }
      const history = getEditHistory(data);
      const command = direction === "undo" ? history.undo() : history.redo();
      if (command) {
        setSelectionState({ data, ids: new Set(affectedIds(data, command)) });
        setVersion((v) => v + 1);
      }
    },
    [data]
  );
  const undo = useCallback(() => step("undo"), [step]);
  const redo = useCallback(() => step("redo"), [step]);

  const history = data ? getEditHistory(data) : undefined;
  const canUndo = history?.canUndo ?? false;
  const canRedo = history?.canRedo ?? false;
  const undoLabel = history?.undoLabel;
  const redoLabel = history?.redoLabel;

  const value = useMemo(
    () => ({
      data,
      events,
      selection,
      setSelection,
      apply,
      undo,
      redo,
      canUndo,
      canRedo,
      undoLabel,
      redoLabel,
      chordToChoose,
      chooseChordMode,
      closeChordChoice,
      loaded,
      setLoaded,
    }),
    // version changes whenever the history does
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, events, selection, setSelection, apply, undo, redo, loaded, version, chordToChoose, chooseChordMode, closeChordChoice]
  );

  return (
    <PianoRollContext.Provider value={value}>
      {children}
    </PianoRollContext.Provider>
  );
};
