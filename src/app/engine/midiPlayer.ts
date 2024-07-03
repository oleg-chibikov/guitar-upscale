import { EventsByTick } from "@/app/engine/eventsByTick";
import {
  recreatePlaybackPromise,
  waitForPlaybackToFinish,
} from "@/app/engine/playPromise";
import { playAllNotes, waitForTick } from "@/app/engine/playerHelper";
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

    // Edge case: if there are no notes, just return
    if (!eventsByTick.hasItems) {
      console.log(logPrefix + "No events for playback");
      return;
    }

    console.log(logPrefix + "Midi info", eventsByTick);

    // await waitForNextBar();

    let currentTick = 1;
    const items = eventsByTick.items;
    for (let i = 0; i < items.length; i++) {
      const { tick, events } = items[i];
      if (checkFinished()) {
        console.log(logPrefix + "Finished playback prematurely");
        return;
      }

      // these 2 promises should be waited for sequentially - we should check if it's paused after the clock interval has been released, otherwise the extra note might get played
      await waitForTick(tick, currentTick, checkFinished, logPrefix);
      console.log(logPrefix + "Waiting for pause");
      const afterPauseAction = await waitForPauseToBeReleased();
      console.log(logPrefix + "After pause: " + afterPauseAction);
      if (afterPauseAction === undefined) {
        if (isLastEventValue) {
          store.dispatch(setIsLastEvent(false));
        }
        if (isFirstEventValue) {
          store.dispatch(setIsFirstEvent(false));
        }
        currentTick = tick;

        if (checkFinished()) {
          console.log(logPrefix + "Finished playback prematurely");
          return;
        }

        playAllNotes(events, logPrefix, tick);
      } else {
        switch (afterPauseAction) {
          case PauseResolveValue.GoBack: {
            if (isLastEventValue) {
              i--; // special edge case to play the last note correctly
              store.dispatch(setIsLastEvent(false));
            } else {
              i -= 2; // -2 to avoid being stuck on the current event as then the loop will increment the counter
            }

            if (i <= 0) {
              i = 0;
              store.dispatch(setIsFirstEvent(true));
            }
            const previousItem = items[i];
            currentTick = previousItem.tick;
            playAllNotes(previousItem.events, logPrefix, tick);
            if (i === 0) {
              i = -1; // special edge case to play the first note correctly (so that GoForward / Play would start from the 0 note)
            }
            break;
          }
          case PauseResolveValue.GoForward: {
            const nextItem = items[i];
            currentTick = nextItem.tick;
            playAllNotes(nextItem.events, logPrefix, tick);
            if (isFirstEventValue) {
              store.dispatch(setIsFirstEvent(false));
            }
            if (i === items.length - 1) {
              store.dispatch(setIsLastEvent(true));
              i--; // allow playing the last note over and over again
            }
            break;
          }
        }
      }
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
  onStarted?.();
  await midiPlayer.play(eventsByTick, logPrefix);
  dispatch(setIsPlaying(false));
  recreatePlaybackPromise();
  console.log(logPrefix + "Stopped new playback");
};
