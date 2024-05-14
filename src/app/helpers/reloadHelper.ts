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
