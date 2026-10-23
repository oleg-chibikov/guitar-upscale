import { TICKS_IN_BAR } from "@/app/data/clockConstants";
import {
  getLastTickBarPosition,
  setNextTickBarPosition,
  waitForNextTick,
} from "@/app/engine/clock/mainClock";
import { EventsByTick } from "@/app/engine/eventsByTick";
import {
  getLoopRange,
  getStartTick,
  publishPlayhead,
  returnToStart,
  seek,
  takePendingSeek,
} from "@/app/engine/pianoRoll/playhead";
import { setPianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { getAudibleEvents } from "@/app/engine/pianoRoll/soloTrack";
import {
  recreatePlaybackPromise,
  waitForPlaybackToFinish,
} from "@/app/engine/playPromise";
import { playAllNotes } from "@/app/engine/playerHelper";
import {
  PauseResolveValue,
  isClockUsedBesidesMelodyAndMetronome,
  isFirstEventValue,
  isLastEventValue,
  isMetronomeActiveValue,
  isPausedValue,
  isPlayingValue,
  setIsFirstEvent,
  setIsLastEvent,
  setIsPlaying,
  stopMetronomeIfIdle,
  waitForPauseToBeReleased,
} from "@/app/store/settingsSlice";
import { store } from "@/app/store/store";
import { Dispatch } from "react";
import { UnknownAction } from "redux";

const checkFinished = () => !isPlayingValue;

const toBarPosition = (tick: number) =>
  ((tick % TICKS_IN_BAR) + TICKS_IN_BAR) % TICKS_IN_BAR;

// a melody keeps its bar position between plays, so a replay or a piano roll play lands on the same beat
const startBarPositions = new WeakMap<EventsByTick, number>();

class MidiPlayer {
  /**
   * @param tickZeroBarPosition the position inside the bar where melody tick 0 lands.
   * @returns true when the melody played to the end.
   */
  async play(
    eventsByTick: EventsByTick,
    logPrefix: string,
    tickZeroBarPosition: number,
    onStarted?: () => void,
  ): Promise<boolean> {
    if (isLastEventValue) {
      store.dispatch(setIsLastEvent(false));
    }
    if (isFirstEventValue) {
      store.dispatch(setIsFirstEvent(false));
    }
    console.log(logPrefix + "Playing midi file");

    if (!eventsByTick.hasItems) {
      console.log(logPrefix + "No events for playback");
      onStarted?.();
      return true;
    }

    console.log(logPrefix + "Midi info", eventsByTick);

    let currentTick = getStartTick(eventsByTick);
    let lastTick = eventsByTick.lastTick;
    let isAligned = false;
    // a running metronome sets the bar for a new melody. After a seek the clock follows the melody
    let canMoveClock = !isMetronomeActiveValue;
    let isStarted = false;

    const jumpTo = () => {
      const seekTick = takePendingSeek();
      if (seekTick === undefined) {
        return;
      }
      currentTick = seekTick;
      isAligned = false;
      canMoveClock = true;
      store.dispatch(
        setIsFirstEvent(
          eventsByTick.getPreviousEvents(currentTick) === undefined,
        ),
      );
      store.dispatch(setIsLastEvent(currentTick >= eventsByTick.lastTick));
    };

    try {
      const isInLoop = () => {
        const loop = getLoopRange(eventsByTick);
        return loop !== undefined && currentTick < loop.end;
      };
      while (currentTick <= lastTick || isInLoop()) {
        if (checkFinished()) {
          console.log(logPrefix + "Finished playback prematurely");
          return false;
        }

        await waitForNextTick();

        jumpTo();

        if (isPausedValue) {
          const afterPauseAction = await waitForPauseToBeReleased();
          jumpTo();
          if (afterPauseAction === undefined) {
            // pause released: wait for the clock tick that matches currentTick
            isAligned = false;
            canMoveClock = false;
          } else {
            currentTick = this.move(
              afterPauseAction,
              eventsByTick,
              logPrefix,
              currentTick,
            );
            // the next play or stop starts from here
            seek(eventsByTick, currentTick, false);
          }
          continue;
        }

        if (!isAligned) {
          const barPosition = toBarPosition(currentTick + tickZeroBarPosition);
          if (barPosition !== getLastTickBarPosition()) {
            if (canMoveClock && !isClockUsedBesidesMelodyAndMetronome()) {
              // start on the next tick instead of waiting up to a bar
              setNextTickBarPosition(barPosition);
            }
            continue;
          }
          isAligned = true;
          if (!isStarted) {
            isStarted = true;
            onStarted?.();
          }
        }

        const events = eventsByTick.getEvents(currentTick);
        if (events) {
          playAllNotes(
            getAudibleEvents(eventsByTick, events),
            logPrefix,
            currentTick,
          );
        }
        publishPlayhead(currentTick);

        if (currentTick === lastTick) {
          store.dispatch(setIsLastEvent(true));
        }

        currentTick++;

        const loop = getLoopRange(eventsByTick);
        if (loop && currentTick === loop.end) {
          // the loop end works like a seek to the loop start
          currentTick = loop.start;
          isAligned = false;
          canMoveClock = true;
          if (isLastEventValue) {
            store.dispatch(setIsLastEvent(false));
          }
        }

        // this can change anytime
        lastTick = eventsByTick.lastTick;
      }
    } finally {
      if (!isStarted) {
        onStarted?.();
      }
      returnToStart(eventsByTick);
    }
    store.dispatch(setIsLastEvent(true));
    store.dispatch(setIsFirstEvent(true));
    console.log(logPrefix + "All events are played");
    return true;
  }

  // plays the previous or next event while paused and returns its tick
  private move(
    action: PauseResolveValue,
    eventsByTick: EventsByTick,
    logPrefix: string,
    currentTick: number,
  ): number {
    switch (action) {
      case PauseResolveValue.GoBack: {
        const prevData = eventsByTick.getPreviousEvents(currentTick);
        if (!prevData) {
          return currentTick;
        }
        playAllNotes(
          getAudibleEvents(eventsByTick, prevData.events),
          logPrefix,
          prevData.tick,
        );
        store.dispatch(setIsLastEvent(false));

        if (eventsByTick.getPreviousEvents(prevData.tick) === undefined) {
          store.dispatch(setIsFirstEvent(true));
        }
        return prevData.tick;
      }
      case PauseResolveValue.GoForward: {
        const nextData = eventsByTick.getNextEvents(currentTick);
        if (!nextData) {
          return currentTick;
        }
        playAllNotes(
          getAudibleEvents(eventsByTick, nextData.events),
          logPrefix,
          nextData.tick,
        );
        store.dispatch(setIsFirstEvent(false));

        if (nextData.tick === eventsByTick.lastTick) {
          store.dispatch(setIsLastEvent(true));
        }
        return nextData.tick;
      }
    }
  }
}

const midiPlayer = new MidiPlayer();

export const stopPlayback = async (
  dispatch: Dispatch<UnknownAction>,
  logPrefix: string,
) => {
  if (isPlayingValue) {
    console.log(logPrefix + "Stopping current playback");
    dispatch(setIsPlaying(false)); // stop current playback
    console.log("Waiting for current playback to finish");
    await waitForPlaybackToFinish(); // wait for current playback to finish;
    console.log(logPrefix + "Stopped current playback");
  }
};

export const playMidi = async (
  dispatch: Dispatch<UnknownAction>,
  eventsByTick: EventsByTick,
  logPrefix: string,
  onStarted?: () => void,
  startBarPosition?: number,
) => {
  await stopPlayback(dispatch, logPrefix);
  console.log(logPrefix + "Starting new playback");
  recreatePlaybackPromise();
  dispatch(setIsPlaying(true));

  setPianoRollData(eventsByTick, dispatch);
  if (startBarPosition !== undefined) {
    startBarPositions.set(eventsByTick, startBarPosition);
  }
  const isPlayedToEnd = await midiPlayer.play(
    eventsByTick,
    logPrefix,
    startBarPositions.get(eventsByTick) ?? 0,
    onStarted,
  );
  dispatch(setIsPlaying(false));
  recreatePlaybackPromise();
  if (isPlayedToEnd) {
    stopMetronomeIfIdle(dispatch);
  }
  console.log(logPrefix + "Stopped new playback");
};
