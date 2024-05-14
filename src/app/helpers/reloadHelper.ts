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

export function incrementAndReload(key: string, currentValue: number) {
  console.log("Reloading page");
  // check to avoid endless reloads
  localStorage.setItem(key, (currentValue + 1).toString());
  location.reload();
}

export const processWithReloads = async (
  key: string,
  isMismatch: () => boolean,
  onMismatchWithinLimit: () => Promise<boolean>,
  onMismatchAndLimitExceeded: () => void,
  onMatch: () => void,
  limit: number = 2
) => {
  const signInCheckCount = getReloadCount(key);

  if (isMismatch()) {
    console.log("Signin status mismatch", key);
    if (signInCheckCount < limit) {
      // check to avoid endless reloads
      const shouldIncrement = await onMismatchWithinLimit();
      if (shouldIncrement) {
        incrementAndReload(key, signInCheckCount);
      } else {
        console.log("Mismatch cannot be fixed - skipping reload");
      }
    } else {
      console.log("Reload attempts exceeded", key);
      onMismatchAndLimitExceeded();
    }
  } else {
    console.log("Signin status matched", key);
    // sign in status in state matches session
    clearReloadCount(key);
    onMatch();
  }
};
