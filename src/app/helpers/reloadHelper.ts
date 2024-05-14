import { sleep } from "../engine/sleep";
import { setLoadingMessage } from "../store/uiSlice";

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
  dispatch: (param: any) => void,
  reloadMessage?: string
) {
  console.log("Waiting to reload");
  dispatch(
    setLoadingMessage(
      (reloadMessage ?? "Signin status mismatch") + " - reloading page"
    )
  );
  await sleep(2000);
  console.log("Reloading page");
  // check to avoid endless reloads
  localStorage.setItem(key, (currentValue + 1).toString());
  location.reload();
}

export const processWithReloads = async (
  dispatch: (param: any) => void,
  key: string,
  isMismatch: () => boolean,
  onMismatchWithinLimit: () => Promise<{
    shouldIncrement: boolean;
    message?: string;
  }>,
  onMismatchAndLimitExceeded: () => void,
  onMatch: () => void,
  limit: number = 2
) => {
  const signInCheckCount = getReloadCount(key);

  const clear = () => {
    dispatch(setLoadingMessage(undefined));
    clearReloadCount(key);
  };

  if (isMismatch()) {
    console.log("Signin status mismatch", key);
    if (signInCheckCount < limit) {
      // check to avoid endless reloads
      const { shouldIncrement, message } = await onMismatchWithinLimit();
      if (shouldIncrement) {
        await incrementAndReload(key, signInCheckCount, dispatch, message);
      } else {
        console.log("Mismatch cannot be fixed - skipping reload");
        clear();
      }
    } else {
      console.log("Reload attempts exceeded", key);
      onMismatchAndLimitExceeded();
      clear();
    }
  } else {
    console.log("Signin status matched", key);
    // sign in status in state matches session
    onMatch();
    clear();
  }
};
