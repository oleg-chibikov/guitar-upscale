import {
  currentlyRecordingLooperChannel,
  looperHasUnsavedLoops,
} from "@/app/engine/looper/looperShared";
import { isRecordingValue } from "@/app/store/settingsSlice";

// a reload or a closed tab loses a take in progress and loops recorded since the last save
export const hasUnsavedWork = () =>
  isRecordingValue ||
  looperHasUnsavedLoops ||
  currentlyRecordingLooperChannel !== undefined;

let reloadConfirmed = false;

export const reloadWithoutWarning = () => {
  reloadConfirmed = true;
  window.location.reload();
};

export const warnBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!reloadConfirmed && hasUnsavedWork()) {
    event.preventDefault();
  }
};
