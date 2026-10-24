import { saveLoopsBeforeClear } from "@/app/engine/looper/looperShared";
import { Middleware, isAction } from "@reduxjs/toolkit";
import {
  setCapo,
  setScale,
  setScaleGroup,
  setTuning,
} from "@/app/store/settingsSlice";

// each of these clears the looper once the reducer has run
const CLEARS_LOOPER = new Set<string>([
  setScale.type,
  setScaleGroup.type,
  setTuning.type,
  setCapo.type,
]);

export const looperGuard: Middleware = () => (next) => (action) => {
  if (isAction(action) && CLEARS_LOOPER.has(action.type)) {
    saveLoopsBeforeClear?.();
  }
  return next(action);
};
