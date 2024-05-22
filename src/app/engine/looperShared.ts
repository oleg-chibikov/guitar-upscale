export const currentlyPlayingLooperChannels = new Set<number>();
export let currentlyRecordingLooperChannel: number | undefined;
export const setCurrentlyRecordingLooperChannel = (
  channel: number | undefined
) => {
  currentlyRecordingLooperChannel = channel;
};
