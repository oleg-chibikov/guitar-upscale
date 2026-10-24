import { AlertType } from "@/app/data/alertType";
import { getExampleName, getNewSongName } from "@/app/data/example";
import type { LooperState } from "@/app/engine/looper/looper";
import {
  buildLooperSong,
  getRecordedLoops,
} from "@/app/engine/looper/looperSong";
import {
  looperHasUnsavedLoops,
  looperSong,
  setLooperHasUnsavedLoops,
  setSaveLoopsBeforeClear,
} from "@/app/engine/looper/looperShared";
import { scaleGroupValue, scaleValue } from "@/app/store/settingsSlice";
import { store } from "@/app/store/store";
import { setAndShowAlert } from "@/app/store/uiSlice";

type SongExport = typeof import("@/app/engine/songs/songExport");

// the save runs before the key changes, so the writer has to be loaded by then
let songExport: SongExport | undefined;

/**
 * A key, tuning or capo change clears the looper. Loops recorded since the last save go to the song list first
 */
export const registerLooperAutosave = (state: LooperState) => {
  void import("@/app/engine/songs/songExport").then((module) => {
    songExport = module;
  });
  setSaveLoopsBeforeClear(() => {
    if (!looperHasUnsavedLoops || !songExport) {
      return;
    }
    const events = buildLooperSong(getRecordedLoops(state));
    if (!events.hasItems) {
      return;
    }
    setLooperHasUnsavedLoops(false);
    const linked = looperSong;
    const name = linked?.name ?? getNewSongName("Loops");
    // written now, while the old key and tuning hold
    const song = { ...songExport.eventsToSong(events), band: "", title: name };
    const snapshot = { song, scaleGroup: scaleGroupValue, scale: scaleValue };
    void (async () => {
      const { addNewSong, replaceSongEvents } =
        await import("@/app/engine/songs/songLibrary");
      const saved =
        (linked && (await replaceSongEvents(linked.id, events, song))) ??
        (await addNewSong(events, name, snapshot));
      store.dispatch(
        setAndShowAlert({
          message: `The key change cleared the looper. The loops are in the song list as ${getExampleName(saved)}`,
          alertType: AlertType.Success,
        }),
      );
    })().catch((error) => console.error("Cannot save the loops", error));
  });
};
