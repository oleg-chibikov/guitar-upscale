import { MetronomeEventBus } from "@/app/engine/eventBus";
import { EventForTick, EventsByTick } from "@/app/engine/eventsByTick";
import { EditCommand } from "@/app/engine/pianoRoll/editCommand";
import { getEditHistory, pianoRollEdits$ } from "@/app/engine/pianoRoll/editHistory";
import { deleteEvents, EditResult } from "@/app/engine/pianoRoll/operations";
import {
  pianoRollData,
  setPianoRollData,
} from "@/app/engine/pianoRoll/pianoRollState";
import { playheadTick$ } from "@/app/engine/pianoRoll/playhead";
import {
  addTrackInfo,
  getEventTrack,
  getTrackInfos,
  listTracks,
  PianoRollTrack,
  removeTrackInfo,
  renameTrackInfo,
} from "@/app/engine/pianoRoll/pianoRollTracks";
import { BehaviorSubject } from "rxjs";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { useDispatch } from "react-redux";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PianoRollSource = {
  id: string;
  label: string;
  data: EventsByTick;
  // set for looper tracks
  looperChannel?: number;
  loopLengthTicks?: number;
  positionInLoop?: () => number | undefined;
};

const MELODY_SOURCE_ID = "melody";

interface PianoRollContextType {
  sources: PianoRollSource[];
  source: PianoRollSource | undefined;
  setSourceId: (id: string) => void;
  // the tracks of the shown melody, for example 2 guitars and vocals
  tracks: PianoRollTrack[];
  // the track being edited. Undefined edits every track at once
  activeTrack: PianoRollTrack | undefined;
  setActiveTrack: (trackNumber: number | undefined) => void;
  // adds an empty track and makes it the one being edited
  addTrack: () => void;
  // deletes the track's notes through the undo history
  deleteTrack: (track: PianoRollTrack) => void;
  renameTrack: (track: PianoRollTrack, name: string) => void;
  // the playhead of the shown track: the melody player's or the loop's
  playhead$: BehaviorSubject<number>;
  data: EventsByTick | undefined;
  // every note of the melody, the dimmed tracks included
  allEvents: EventForTick[];
  // the notes that can be edited: the active track's, or every note
  events: EventForTick[];
  // the other tracks' notes, drawn dimmed
  inactiveEvents: EventForTick[];
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
  // marks the shown track as scrolled into view
  setLoaded: (loaded: boolean) => void;
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
  const dispatch = useDispatch();
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  const showReplayTrigger = useSettingsSelector((s) => s.showReplayTrigger);

  const looperStateUpdateTrigger = useSettingsSelector(
    (s) => s.looperStateUpdateTrigger
  );
  const guitarSettingsUpdateCount = useSettingsSelector(
    (s) => s.guitarSettingsUpdateCount
  );

  // pianoRollData is a module variable. showReplayTrigger flips whenever it changes
  const melody = useMemo(
    () => (pianoRollExpanded ? pianoRollData : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pianoRollExpanded, showReplayTrigger]
  );

  const [loopSources, setLoopSources] = useState<PianoRollSource[]>([]);
  useEffect(() => {
    if (!pianoRollExpanded) return;
    let cancelled = false;
    // the looper loads on demand, so the piano roll does the same
    void import("@/app/engine/looper/looper").then(({ looperState }) => {
      if (cancelled) return;
      setLoopSources(
        looperState.flatMap(({ looperRecorder, hasRecording }, channel) => {
          const loop = looperRecorder.items;
          return hasRecording && loop
            ? [
                {
                  id: `loop-${channel}`,
                  label: `Loop ${channel + 1}`,
                  data: loop,
                  looperChannel: channel,
                  loopLengthTicks: looperRecorder.loopLengthTicks,
                  positionInLoop: () => looperRecorder.positionInLoop,
                },
              ]
            : [];
        })
      );
    });
    return () => {
      cancelled = true;
    };
  }, [pianoRollExpanded, looperStateUpdateTrigger, guitarSettingsUpdateCount]);

  // with nothing loaded the piano roll still offers a blank melody to draw in
  const blankMelody = useMemo(() => new EventsByTick(), []);
  const sources = useMemo(
    () => [
      { id: MELODY_SOURCE_ID, label: "Melody", data: melody ?? blankMelody },
      ...loopSources,
    ],
    [melody, blankMelody, loopSources]
  );
  const [sourceId, setSourceIdState] = useState(MELODY_SOURCE_ID);
  const setSourceId = useCallback((id: string) => {
    setSourceIdState(id);
  }, []);
  const source = sources.find((s) => s.id === sourceId) ?? sources.at(0);
  const data = source?.data;

  // each track scrolls to its notes the first time it shows. Closing the piano roll forgets it
  const [scrolledTrack, setScrolledTrack] = useState<EventsByTick | undefined>();
  const [wasExpanded, setWasExpanded] = useState(pianoRollExpanded);
  if (wasExpanded !== pianoRollExpanded) {
    setWasExpanded(pianoRollExpanded);
    if (!pianoRollExpanded) setScrolledTrack(undefined);
  }
  const loaded = data !== undefined && scrolledTrack === data;
  const setLoaded = useCallback(
    (value: boolean) => setScrolledTrack(value ? data : undefined),
    [data]
  );

  const loopPlayhead$ = useMemo(() => new BehaviorSubject<number>(0), []);
  const positionInLoop = source?.positionInLoop;
  useEffect(() => {
    if (!positionInLoop) return;
    // the clock ticks drive the loop, so they drive its playhead too
    const subscription = MetronomeEventBus.subscribe(() => {
      const position = positionInLoop() ?? 0;
      if (loopPlayhead$.value !== position) loopPlayhead$.next(position);
    });
    return () => subscription.unsubscribe();
  }, [positionInLoop, loopPlayhead$]);
  const playhead$ = positionInLoop ? loopPlayhead$ : playheadTick$;

  const allEvents = useMemo(
    () => data?.flatItems ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, version]
  );

  // a song names its tracks. Other tracks get names from their instruments
  const tracks = useMemo(
    () => listTracks(allEvents, data ? getTrackInfos(data) : undefined),
    // renames change the track infos in place, so version tells when
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEvents, data, version]
  );

  // the track being edited belongs to one melody, like the selection
  const [activeTrackState, setActiveTrackState] = useState<{
    data: EventsByTick | undefined;
    trackNumber: number | undefined;
  }>({ data: undefined, trackNumber: undefined });
  const activeTrack =
    activeTrackState.data === data
      ? tracks.find(
          ({ trackNumber }) => trackNumber === activeTrackState.trackNumber
        )
      : undefined;

  const { events, inactiveEvents } = useMemo(() => {
    if (!activeTrack) {
      return { events: allEvents, inactiveEvents: [] };
    }
    const isActive = ({ event }: EventForTick) =>
      getEventTrack(event) === activeTrack.trackNumber;
    return {
      events: allEvents.filter(isActive),
      inactiveEvents: allEvents.filter((item) => !isActive(item)),
    };
  }, [allEvents, activeTrack]);

  // a selection belongs to one melody and drops when another one loads
  const [selectionState, setSelectionState] = useState<{
    data: EventsByTick | undefined;
    ids: ReadonlySet<string>;
  }>({ data: undefined, ids: new Set() });
  const selection = useMemo(() => {
    if (selectionState.data !== data) {
      return new Set<string>();
    }
    if (!activeTrack) {
      return selectionState.ids;
    }
    // an undo can touch a dimmed track. Its notes stay unselected
    const editable = new Set(events.map(({ event }) => event.id));
    return new Set(
      Array.from(selectionState.ids).filter((id) => editable.has(id))
    );
  }, [selectionState, data, activeTrack, events]);

  const setSelection = useCallback(
    (ids: Iterable<string>) => {
      setSelectionState({ data, ids: new Set(ids) });
    },
    [data]
  );

  const setActiveTrack = useCallback(
    (trackNumber: number | undefined) => {
      setActiveTrackState({ data, trackNumber });
      setSelectionState({ data, ids: new Set() });
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
      if (data === blankMelody && pianoRollData !== blankMelody) {
        // the first note makes the blank melody the one that plays and exports
        setPianoRollData(blankMelody, dispatch);
      }
      setSelectionState({ data, ids: new Set(newSelection) });
      setVersion((v) => v + 1);
      if (chordsWithChangedMode.length) {
        // the move picked a stand-in mode. Offer the others
        setChordQueue((queue) => [...queue, ...chordsWithChangedMode]);
      }
    },
    [data, blankMelody, dispatch]
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

  const addTrack = useCallback(() => {
    if (!data) return;
    const trackNumber = addTrackInfo(data, tracks);
    setActiveTrackState({ data, trackNumber });
    setSelectionState({ data, ids: new Set() });
    setVersion((v) => v + 1);
  }, [data, tracks]);

  const deleteTrack = useCallback(
    (track: PianoRollTrack) => {
      if (!data) return;
      removeTrackInfo(data, track);
      const ids = allEvents
        .filter(({ event }) => getEventTrack(event) === track.trackNumber)
        .map(({ event }) => event.id);
      const result = deleteEvents(data, ids);
      apply({
        ...result,
        command: result.command && { ...result.command, label: "Delete track" },
      });
      setActiveTrackState({ data, trackNumber: undefined });
      setVersion((v) => v + 1);
    },
    [data, allEvents, apply]
  );

  const renameTrack = useCallback(
    (track: PianoRollTrack, name: string) => {
      if (!data) return;
      renameTrackInfo(data, track, name);
      setVersion((v) => v + 1);
      // saves the song under the new track name
      pianoRollEdits$.next(data);
    },
    [data]
  );

  const history = data ? getEditHistory(data) : undefined;
  const canUndo = history?.canUndo ?? false;
  const canRedo = history?.canRedo ?? false;
  const undoLabel = history?.undoLabel;
  const redoLabel = history?.redoLabel;

  const value = useMemo(
    () => ({
      sources,
      source,
      setSourceId,
      tracks,
      activeTrack,
      setActiveTrack,
      addTrack,
      deleteTrack,
      renameTrack,
      playhead$,
      data,
      allEvents,
      events,
      inactiveEvents,
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
    [sources, source, setSourceId, tracks, activeTrack, setActiveTrack, addTrack, deleteTrack, renameTrack, playhead$, data, allEvents, events, inactiveEvents, selection, setSelection, apply, undo, redo, loaded, setLoaded, version, chordToChoose, chooseChordMode, closeChordChoice]
  );

  return (
    <PianoRollContext.Provider value={value}>
      {children}
    </PianoRollContext.Provider>
  );
};
