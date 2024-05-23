import { toggleInterval } from "../store/settingsSlice";
import { LooperRecorder } from "./looperRecorder";
import {
  currentlyPlayingLooperChannels,
  currentlyRecordingLooperChannel,
  setCurrentlyRecordingLooperChannel,
} from "./looperShared";

export const LOOPER_CHANNEL_COUNT = 4;

export type LooperChannelState = {
  isPlaying: boolean;
  isRecording: boolean;
  looperRecorder: LooperRecorder;
};

export type LooperState = LooperChannelState[];

export const looperState: LooperState = Array.from(
  { length: LOOPER_CHANNEL_COUNT },
  () => ({
    isRecording: false,
    isPlaying: false,
    looperRecorder: new LooperRecorder(),
  })
);

export const setRecordingInLooperChannel = (
  channel: number,
  value: boolean
) => {
  const looperChannel = looperState[channel];
  if (
    currentlyRecordingLooperChannel !== undefined &&
    currentlyRecordingLooperChannel !== channel
  ) {
    // stop recording in another channel - only one allowed
    setRecordingInLooperChannel(currentlyRecordingLooperChannel, false);
  }

  looperChannel.isRecording = value;
  if (value) {
    // start recording
    // stop playing in the current channel
    setPlayingInLooperChannel(channel, false);
    setCurrentlyRecordingLooperChannel(channel);
    looperChannel.looperRecorder.startRecording();
    toggleInterval(true);
  } else {
    // stop recording
    setCurrentlyRecordingLooperChannel(undefined);
    looperChannel.looperRecorder.stopRecordingWithoutClearing();
    // toggleInterval(false); - no need to stop interval as the next command turns it on to play
    // start playing in the current channel right after recording
    setPlayingInLooperChannel(channel, true);
  }
};

export const setPlayingInLooperChannel = (channel: number, value: boolean) => {
  const looperChannel = looperState[channel];
  if (value) {
    if (looperChannel.isPlaying) {
      // already playing
      return;
    }
    if (!looperChannel.looperRecorder.hasRecording()) {
      return;
    }

    currentlyPlayingLooperChannels.add(channel);
    toggleInterval(true);
    void looperChannel.looperRecorder.playMidi(); // don't wait for it
    //TODO: repeat until stopped
  } else {
    if (!looperChannel.isPlaying) {
      // doesn't play - nothing to stop
      return;
    }
    currentlyPlayingLooperChannels.delete(channel);
    looperChannel.looperRecorder.stopPlaying();
    toggleInterval(false);
  }
  looperChannel.isPlaying = value;
};
