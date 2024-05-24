import { toggleInterval } from "../store/settingsSlice";
import { LooperRecorder } from "./looperRecorder";
import {
  currentlyPlayingLooperChannels,
  currentlyRecordingLooperChannel,
  setCurrentlyRecordingLooperChannel,
} from "./looperShared";

export const LOOPER_CHANNEL_INITIAL_COUNT = 2;
export const LOOPER_CHANNEL_MIN_COUNT = 1;
export const LOOPER_CHANNEL_MAX_COUNT = 8;

export type LooperChannelState = {
  isPlaying: boolean;
  isRecording: boolean;
  looperRecorder: LooperRecorder;
  hasRecording: boolean;
};

export type LooperState = LooperChannelState[];

const createChannelState = () => {
  return {
    isRecording: false,
    isPlaying: false,
    looperRecorder: new LooperRecorder(),
    hasRecording: false,
  };
};

export const looperState: LooperState = [];

for (let i = 0; i < LOOPER_CHANNEL_INITIAL_COUNT; i++) {
  looperState.push(createChannelState());
}

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
  looperChannel.hasRecording = looperChannel.looperRecorder.hasRecording();
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

export const addChannel = () => {
  if (canAddChannel()) {
    looperState.push(createChannelState());
  }
};

export const removeChannel = () => {
  if (canRemoveChannel()) {
    setRecordingInLooperChannel(looperState.length - 1, false);
    setPlayingInLooperChannel(looperState.length - 1, false);

    looperState.pop();
  }
};

export interface CanSetLooperState {
  setState: (state: LooperState) => void; // it allows setting state for adjacent channels
  disabled?: boolean;
}

export const canAddChannel = () =>
  looperState.length < LOOPER_CHANNEL_MAX_COUNT;

export const canRemoveChannel = () =>
  looperState.length > LOOPER_CHANNEL_MIN_COUNT;
