import { UnknownAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import { setLoadingMessage } from "../store/uiSlice";
import { sleep } from "./sleep";

export const READ_MESSAGE_WAIT_TIME = 3000;

export function getReloadCount(key: string) {
  const signInCheckCountRaw = localStorage.getItem(key);
  const signInCheckCount =
    signInCheckCountRaw !== null ? parseInt(signInCheckCountRaw) : 0;
  console.log(`Value for ${key}`, signInCheckCount);
  return signInCheckCount;
}

export function clearReloadCount(key: string) {
  console.log("Clear " + key);
  localStorage.removeItem(key);
}

export async function incrementAndReload(
  key: string,
  currentValue: number,
  dispatch: Dispatch<UnknownAction>,
  reloadMessage?: string,
  sleepTimeMs?: number,
) {
  dispatch(setLoadingMessage(reloadMessage ?? "Permissions mismatch"));
  console.log("Waiting to reload for the key", key);
  // some time to read the message
  if (sleepTimeMs !== undefined && sleepTimeMs > 0) {
    await sleep(sleepTimeMs);
  }
  console.log("Reloading page for the key", key);
  // check to avoid endless reloads
  localStorage.setItem(key, (currentValue + 1).toString());

  // Unregistering service worker in order to avoid the necessity of double refresh
  await navigator.serviceWorker.getRegistration().then(async (reg) => {
    if (reg) {
      await reg.unregister().then(function () {
        // window.location.href = window.location.href - force reload
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  });
}

export const processWithReloads = async (
  dispatch: Dispatch<UnknownAction>,
  key: string,
  isMismatch: () => boolean,
  onMismatchWithinLimit: () => Promise<{
    shouldReload: boolean;
    message?: string;
  }>,
  onMismatchAndLimitExceeded: () => void,
  onMatch: () => void,
  limit: number = 2,
) => {
  const signInCheckCount = getReloadCount(key);

  const clear = () => {
    dispatch(setLoadingMessage(undefined));
    clearReloadCount(key);
  };

  if (isMismatch()) {
    console.log("Signin status mismatch for the key", key);
    if (signInCheckCount < limit) {
      // check to avoid endless reloads
      const { shouldReload, message } = await onMismatchWithinLimit();
      if (shouldReload) {
        await incrementAndReload(key, signInCheckCount, dispatch, message);
      } else {
        console.log("Skipping reload");
        clear();
      }
    } else {
      console.log("Reload attempts exceeded for the key", key);
      onMismatchAndLimitExceeded();
      clear();
    }
  } else {
    console.log("Signin status matched for the key", key);
    // sign in status in state matches session
    onMatch();
    clear();
  }
};
