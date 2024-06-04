import { EventsByTick } from "@/app/engine/eventsByTick";
import { playAllNotes } from "@/app/engine/playerHelper";
import {
  PauseResolveValue,
  isPlayingValue,
  setPlayerEventCount,
  setPlayerEventIndex,
  waitForPauseToBeReleased,
} from "@/app/store/settingsSlice";
import { store } from "@/app/store/store";
import { waitForTick } from "./mainClock";

const LOG_PREFIX = "MidiPlayer: ";
const checkFinished = () => !isPlayingValue;

export type MidiPlayerOptions = {
  eventsByTick: EventsByTick;
};

export class MidiPlayer {
  private eventsByTick: EventsByTick;

  constructor(eventsByTick: EventsByTick) {
    this.eventsByTick = eventsByTick;
    store.dispatch(setPlayerEventCount(this.eventsByTick.items.length));
    store.dispatch(setPlayerEventIndex(0));
  }

  async play(): Promise<void> {
    console.log(LOG_PREFIX + "Playing midi file");

    // Edge case: if there are no notes, just return
    if (!this.eventsByTick.hasItems) {
      console.log(LOG_PREFIX + "No events in midi file");
      return;
    }

    console.log(LOG_PREFIX + "Midi info", this.eventsByTick);

    // await waitForNextBar();

    let currentTick = 1;
    const items = this.eventsByTick.items;
    for (let i = 0; i < items.length; i++) {
      store.dispatch(setPlayerEventIndex(i));
      const { tick, events } = items[i];
      if (checkFinished()) {
        return;
      }

      // these 2 promises should be waited for sequentially - we should check if it's paused after the clock interval has been released, otherwise the extra note might get played
      await waitForTick(tick, currentTick, checkFinished, LOG_PREFIX);
      console.log(LOG_PREFIX + "Waiting for pause");
      const afterPauseAction = await waitForPauseToBeReleased();
      console.log(LOG_PREFIX + "After pause: " + afterPauseAction);
      if (afterPauseAction === undefined) {
        currentTick = tick;

        if (checkFinished()) {
          return;
        }

        playAllNotes(events, LOG_PREFIX, tick);
      } else {
        switch (afterPauseAction) {
          case PauseResolveValue.GoBack:
            if (i === 0) {
              break;
            }
            i--;
            const previousItem = items[i];
            currentTick = previousItem.tick;
            playAllNotes(previousItem.events, LOG_PREFIX, tick);
            if (i === 0) {
              break;
            }
            i--; // one more decrement is needed to avoid being stuck on the same note
            break;
          case PauseResolveValue.GoForward:
            const nextItem = items[i];
            currentTick = nextItem.tick;
            playAllNotes(nextItem.events, LOG_PREFIX, tick);
            if (i === items.length - 1) {
              i--; // allow playing the last note over and over again
            }
            break;
        }
      }
    }
    console.log(LOG_PREFIX + "All events are played");
  }
}
