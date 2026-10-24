// this file allows setting looper params without the need to load the looper module
export const currentlyPlayingLooperChannels = new Set<number>();
export let currentlyRecordingLooperChannel: number | undefined;
export const setCurrentlyRecordingLooperChannel = (
  channel: number | undefined,
) => {
  currentlyRecordingLooperChannel = channel;
};

export const checkLooperPlaying = () => currentlyPlayingLooperChannels.size > 0;

// the song the loops went to last time. Saving again updates it, a clear starts over
export let looperSong: { id: string; name: string } | undefined;
export const setLooperSong = (song: typeof looperSong) => {
  looperSong = song;
};

// a loop recorded since the last save
export let looperHasUnsavedLoops = false;
export const setLooperHasUnsavedLoops = (value: boolean) => {
  looperHasUnsavedLoops = value;
};

// set once the looper loads. Saves the loops while the old key and tuning still hold
export let saveLoopsBeforeClear: (() => void) | undefined;
export const setSaveLoopsBeforeClear = (save: () => void) => {
  saveLoopsBeforeClear = save;
};
