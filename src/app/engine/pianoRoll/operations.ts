import { ChordMode } from "@/app/data/chordModes";
import { Note } from "@/app/data/notes";
import {
  ChordOrNote,
  EventForTick,
  EventsByTick,
} from "@/app/engine/eventsByTick";
import {
  CommandBuilder,
  EditCommand,
} from "@/app/engine/pianoRoll/editCommand";
import { clampPitch, fromPitch } from "@/app/engine/pianoRoll/geometry";
import {
  canPlaceAtPitch,
  cloneWithNewId,
  getEventDuration,
  getEventPitch,
  withDuration,
  withPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import {
  PianoRollTrack,
  withTrack,
} from "@/app/engine/pianoRoll/pianoRollTracks";
import { snapPitchToScale, snapTick } from "@/app/engine/pianoRoll/snap";

export type EditResult = {
  command: EditCommand | undefined;
  // ids to keep selected after the edit
  selection: string[];
  // chords that had to switch mode because the new root lacks the old one
  chordsWithChangedMode: string[];
};

const existing = (data: EventsByTick, ids: Iterable<string>) =>
  Array.from(ids)
    .map((id) => data.getEvent(id))
    .filter((state): state is EventForTick => state !== undefined);

export type MoveTarget = { tick: number; pitch: number };

/**
 * Where each event lands for a drag. Pitch changes only when every event fits at its new pitch.
 */
export const resolveMove = (
  data: EventsByTick,
  ids: Iterable<string>,
  deltaTick: number,
  deltaPitch: number,
  scalePattern?: Set<Note>,
): Map<string, MoveTarget> => {
  const states = existing(data, ids);
  const minTick = Math.min(...states.map((s) => s.tick));
  // the earliest event stops at zero and the rest keep their spacing
  const safeDeltaTick = Math.max(deltaTick, -minTick);

  const pitchFor = (event: ChordOrNote) => {
    const pitch = getEventPitch(event);
    if (deltaPitch === 0) {
      return pitch;
    }
    const target = clampPitch(pitch + deltaPitch);
    return scalePattern ? snapPitchToScale(target, scalePattern) : target;
  };
  const pitchFits = states.every(({ event }) =>
    canPlaceAtPitch(event, pitchFor(event)),
  );

  return new Map(
    states.map(({ tick, event }) => [
      event.id,
      {
        tick: tick + safeDeltaTick,
        pitch: pitchFits ? pitchFor(event) : getEventPitch(event),
      },
    ]),
  );
};

/**
 * Steps each event up or down. With a scale, a step goes to the next note of the scale.
 * Nothing moves when one of the events would leave what the neck or the chord generator can play.
 */
export const resolveTranspose = (
  data: EventsByTick,
  ids: Iterable<string>,
  steps: number,
  scalePattern?: Set<Note>,
): Map<string, MoveTarget> => {
  const states = existing(data, ids);
  const direction = Math.sign(steps);
  const stepPitch = (pitch: number) => {
    let next = pitch;
    for (let i = 0; i < Math.abs(steps); i++) {
      next = clampPitch(next + direction);
      while (
        scalePattern &&
        scalePattern.size > 0 &&
        !scalePattern.has(fromPitch(next).note) &&
        clampPitch(next + direction) !== next
      ) {
        next += direction;
      }
    }
    return next;
  };
  const targets = new Map(
    states.map(({ tick, event }) => [
      event.id,
      { tick, pitch: stepPitch(getEventPitch(event)) },
    ]),
  );
  const fits = states.every(({ event }) =>
    canPlaceAtPitch(event, targets.get(event.id)!.pitch),
  );
  return fits ? targets : new Map();
};

export const moveEvents = (
  data: EventsByTick,
  targets: Map<string, MoveTarget>,
  copy: boolean,
): EditResult => {
  const builder = new CommandBuilder(data, copy ? "Copy notes" : "Move notes");
  const selection: string[] = [];
  const chordsWithChangedMode: string[] = [];

  targets.forEach((target, id) => {
    const state = data.getEvent(id);
    if (!state) {
      return;
    }
    const change = withPitch(state.event, target.pitch);
    if (!change) {
      return;
    }
    const event = copy ? cloneWithNewId(change.event) : change.event;
    builder.set(event.id, { tick: target.tick, event });
    selection.push(event.id);
    if (change.chordModeChanged) {
      chordsWithChangedMode.push(event.id);
    }
  });

  return { command: builder.build(), selection, chordsWithChangedMode };
};

export const deleteEvents = (
  data: EventsByTick,
  ids: Iterable<string>,
): EditResult => {
  const builder = new CommandBuilder(data, "Delete notes");
  existing(data, ids).forEach(({ event }) => builder.set(event.id, null));
  return { command: builder.build(), selection: [], chordsWithChangedMode: [] };
};

export const addEvent = (
  data: EventsByTick,
  tick: number,
  event: ChordOrNote,
): EditResult => ({
  command: new CommandBuilder(data, "Add note")
    .set(event.id, { tick, event })
    .build(),
  selection: [event.id],
  chordsWithChangedMode: [],
});

export type ResizeEdge = "start" | "end";
export type ResizeTarget = { tick: number; duration: number };

/**
 * New bounds for a resize. The dragged event snaps its edge to the grid, the others follow by the same amount.
 */
export const resolveResize = (
  data: EventsByTick,
  ids: Iterable<string>,
  anchorId: string,
  edge: ResizeEdge,
  deltaTick: number,
  snapTicks: number,
  snapEnabled = true,
): Map<string, ResizeTarget> => {
  const anchor = data.getEvent(anchorId);
  const result = new Map<string, ResizeTarget>();
  if (!anchor) {
    return result;
  }
  const anchorEdge =
    edge === "end" ? anchor.tick + getEventDuration(anchor.event) : anchor.tick;
  const rawEdge = anchorEdge + deltaTick;
  const snappedDelta =
    (snapEnabled ? snapTick(rawEdge, snapTicks) : Math.round(rawEdge)) -
    anchorEdge;
  const minDuration = snapEnabled ? snapTicks : 1;

  existing(data, ids).forEach(({ tick, event }) => {
    const duration = getEventDuration(event);
    if (edge === "end") {
      result.set(event.id, {
        tick,
        duration: Math.max(minDuration, duration + snappedDelta),
      });
    } else {
      const end = tick + duration;
      const start = Math.max(
        0,
        Math.min(end - minDuration, tick + snappedDelta),
      );
      result.set(event.id, { tick: start, duration: end - start });
    }
  });
  return result;
};

export const resizeEvents = (
  data: EventsByTick,
  targets: Map<string, ResizeTarget>,
): EditResult => {
  const builder = new CommandBuilder(data, "Resize notes");
  targets.forEach(({ tick, duration }, id) => {
    const state = data.getEvent(id);
    if (state) {
      builder.set(id, { tick, event: withDuration(state.event, duration) });
    }
  });
  return {
    command: builder.build(),
    selection: Array.from(targets.keys()),
    chordsWithChangedMode: [],
  };
};

/**
 * Pulls note starts toward the grid. Strength 1 lands them on it.
 */
export const quantizeEvents = (
  data: EventsByTick,
  ids: Iterable<string>,
  snapTicks: number,
  strength = 1,
): EditResult => {
  const builder = new CommandBuilder(data, "Quantize");
  const states = existing(data, ids);
  states.forEach(({ tick, event }) => {
    const target = snapTick(tick, snapTicks);
    builder.set(event.id, {
      tick: Math.round(tick + (target - tick) * strength),
      event,
    });
  });
  return {
    command: builder.build(),
    selection: states.map((s) => s.event.id),
    chordsWithChangedMode: [],
  };
};

/**
 * Sets the MIDI velocity of the single notes. Chords keep theirs
 */
export const setVelocity = (
  data: EventsByTick,
  ids: Iterable<string>,
  velocity: number,
): EditResult => {
  const builder = new CommandBuilder(data, "Change volume");
  const states = existing(data, ids);
  states.forEach(({ tick, event }) => {
    if (event.note && event.note.velocity !== velocity) {
      builder.set(event.id, {
        tick,
        event: { ...event, note: { ...event.note, velocity } },
      });
    }
  });
  return {
    command: builder.build(),
    selection: states.map((s) => s.event.id),
    chordsWithChangedMode: [],
  };
};

export const pasteEvents = (
  data: EventsByTick,
  clipboard: EventForTick[],
  atTick: number,
  // the notes land in this track instead of the one they were copied from
  track?: PianoRollTrack,
): EditResult => {
  const builder = new CommandBuilder(data, "Paste");
  const selection: string[] = [];
  if (clipboard.length) {
    const firstTick = Math.min(...clipboard.map((s) => s.tick));
    clipboard.forEach(({ tick, event }) => {
      const copy = cloneWithNewId(track ? withTrack(event, track) : event);
      builder.set(copy.id, { tick: tick - firstTick + atTick, event: copy });
      selection.push(copy.id);
    });
  }
  return { command: builder.build(), selection, chordsWithChangedMode: [] };
};

export const setChordMode = (
  data: EventsByTick,
  id: string,
  mode: ChordMode,
): EditResult => {
  const builder = new CommandBuilder(data, "Change chord");
  const state = data.getEvent(id);
  const change = state?.event.chord
    ? withPitch(state.event, getEventPitch(state.event), mode)
    : undefined;
  if (state && change) {
    builder.set(id, { tick: state.tick, event: change.event });
  }
  return {
    command: builder.build(),
    selection: [id],
    chordsWithChangedMode: [],
  };
};

/**
 * Range of the events in ticks, for copy and duplicate
 */
export const getSpan = (states: EventForTick[]) => {
  const start = Math.min(...states.map((s) => s.tick));
  const end = Math.max(
    ...states.map((s) => s.tick + getEventDuration(s.event)),
  );
  return { start, end };
};
