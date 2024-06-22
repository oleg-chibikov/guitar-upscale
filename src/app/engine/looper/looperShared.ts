// this file allows setting looper params without the need to load the looper module
export const currentlyPlayingLooperChannels = new Set<number>();
export let currentlyRecordingLooperChannel: number | undefined;
export const setCurrentlyRecordingLooperChannel = (
  channel: number | undefined
) => {
  currentlyRecordingLooperChannel = channel;
};

export const isLooperPlaying = () => currentlyPlayingLooperChannels.size > 0;
