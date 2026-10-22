import { TICKS_IN_BAR } from "@/app/data/clockConstants";
import {
  getLastTickBarPosition,
  waitForNextTick,
} from "@/app/engine/clock/mainClock";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { setPianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import {
  recreatePlaybackPromise,
  waitForPlaybackToFinish,
} from "@/app/engine/playPromise";
import { playAllNotes } from "@/app/engine/playerHelper";
import {
  PauseResolveValue,
  isFirstEventValue,
  isLastEventValue,
  isPausedValue,
  isPlayingValue,
  setIsFirstEvent,
  setIsLastEvent,
  setIsPlaying,
  waitForPauseToBeReleased,
} from "@/app/store/settingsSlice";
import { store } from "@/app/store/store";
import { Dispatch } from "react";
import { UnknownAction } from "redux";

const checkFinished = () => !isPlayingValue;

const toBarPosition = (tick: number) =>
  ((tick % TICKS_IN_BAR) + TICKS_IN_BAR) % TICKS_IN_BAR;

class MidiPlayer {
  /**
   * @param startBarPosition the position inside the bar where melody tick 0 should land.
   * When omitted, tick 0 plays on the next clock tick.
   */
  async play(
    eventsByTick: EventsByTick,
    logPrefix: string,
    startBarPosition?: number,
    onStarted?: () => void
  ): Promise<void> {
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
      return;
    }

    console.log(logPrefix + "Midi info", eventsByTick);

    let currentTick = 0;
    let lastTick = eventsByTick.lastTick;
    // melody tick 0 sits at this bar position. It stays fixed so a resume after pause lands on the same beat
    let tickZeroBarPosition = startBarPosition;
    let isAligned = false;
    let isStarted = false;

    try {
      while (currentTick <= lastTick) {
        if (checkFinished()) {
          console.log(logPrefix + "Finished playback prematurely");
          return;
        }

        await waitForNextTick();

        if (isPausedValue) {
          const afterPauseAction = await waitForPauseToBeReleased();
          if (afterPauseAction === undefined) {
            // pause released: wait for the clock tick that matches currentTick
            isAligned = false;
          } else {
            currentTick = this.move(
              afterPauseAction,
              eventsByTick,
              logPrefix,
              currentTick
            );
          }
          continue;
        }

        if (!isAligned) {
          if (tickZeroBarPosition === undefined) {
            tickZeroBarPosition = toBarPosition(
              getLastTickBarPosition() - currentTick
            );
          }
          if (
            toBarPosition(currentTick + tickZeroBarPosition) !==
            getLastTickBarPosition()
          ) {
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
          playAllNotes(events, logPrefix, currentTick);
        }

        if (currentTick === lastTick) {
          store.dispatch(setIsLastEvent(true));
        }

        currentTick++;

        // this can change anytime
        lastTick = eventsByTick.lastTick;
      }
    } finally {
      if (!isStarted) {
        onStarted?.();
      }
    }
    store.dispatch(setIsLastEvent(true));
    store.dispatch(setIsFirstEvent(true));
    console.log(logPrefix + "All events are played");
  }

  // plays the previous or next event while paused and returns its tick
  private move(
    action: PauseResolveValue,
    eventsByTick: EventsByTick,
    logPrefix: string,
    currentTick: number
  ): number {
    switch (action) {
      case PauseResolveValue.GoBack: {
        const prevData = eventsByTick.getPreviousEvents(currentTick);
        if (!prevData) {
          return currentTick;
        }
        playAllNotes(prevData.events, logPrefix, prevData.tick);
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
        playAllNotes(nextData.events, logPrefix, nextData.tick);
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
  logPrefix: string
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
  startBarPosition?: number
) => {
  await stopPlayback(dispatch, logPrefix);
  console.log(logPrefix + "Starting new playback");
  recreatePlaybackPromise();
  dispatch(setIsPlaying(true));

  setPianoRollData(eventsByTick, dispatch);
  await midiPlayer.play(eventsByTick, logPrefix, startBarPosition, onStarted);
  dispatch(setIsPlaying(false));
  recreatePlaybackPromise();
  console.log(logPrefix + "Stopped new playback");
};
