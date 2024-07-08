import { waitForNextTick } from "@/app/engine/clock/mainClock";
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

class MidiPlayer {
  async play(eventsByTick: EventsByTick, logPrefix: string): Promise<void> {
    if (isLastEventValue) {
      store.dispatch(setIsLastEvent(false));
    }
    if (isFirstEventValue) {
      store.dispatch(setIsFirstEvent(false));
    }
    console.log(logPrefix + "Playing midi file");

    if (!eventsByTick.hasItems) {
      console.log(logPrefix + "No events for playback");
      return;
    }

    console.log(logPrefix + "Midi info", eventsByTick);

    let currentTick = 0;
    let lastTick = eventsByTick.lastTick;

    while (currentTick <= lastTick) {
      if (checkFinished()) {
        console.log(logPrefix + "Finished playback prematurely");
        return;
      }

      await waitForNextTick();

      console.log(logPrefix + "Waiting for pause");
      const afterPauseAction = await waitForPauseToBeReleased();
      console.log(logPrefix + "After pause: " + afterPauseAction);

      if (afterPauseAction === undefined) {
        const events = eventsByTick.getEvents(currentTick);
        if (events) {
          playAllNotes(events, logPrefix, currentTick);
        }

        if (currentTick === lastTick) {
          store.dispatch(setIsLastEvent(true));
        }

        currentTick++;
      } else {
        switch (afterPauseAction) {
          case PauseResolveValue.GoBack: {
            const prevData = eventsByTick.getPreviousEvents(currentTick);
            if (prevData) {
              currentTick = prevData.tick;
              playAllNotes(prevData.events, logPrefix, currentTick);
              store.dispatch(setIsLastEvent(false));

              if (eventsByTick.getPreviousEvents(currentTick) === undefined) {
                store.dispatch(setIsFirstEvent(true));
              }
            }
            break;
          }
          case PauseResolveValue.GoForward: {
            const nextData = eventsByTick.getNextEvents(currentTick);
            if (nextData) {
              currentTick = nextData.tick;
              playAllNotes(nextData.events, logPrefix, currentTick);
              store.dispatch(setIsFirstEvent(false));

              if (currentTick === lastTick) {
                store.dispatch(setIsLastEvent(true));
              }
            }
            break;
          }
        }
      }

      // this can change anytime
      lastTick = eventsByTick.lastTick;
    }
    store.dispatch(setIsLastEvent(true));
    store.dispatch(setIsFirstEvent(true));
    console.log(logPrefix + "All events are played");
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
  onStarted?: () => void
) => {
  await stopPlayback(dispatch, logPrefix);
  console.log(logPrefix + "Starting new playback");
  recreatePlaybackPromise();
  dispatch(setIsPlaying(true));

  setPianoRollData(eventsByTick, dispatch);
  onStarted?.();
  await midiPlayer.play(eventsByTick, logPrefix);
  dispatch(setIsPlaying(false));
  recreatePlaybackPromise();
  console.log(logPrefix + "Stopped new playback");
};
