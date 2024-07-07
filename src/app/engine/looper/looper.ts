import { store } from "@/app/store/store";
import { UnknownAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import {
  isAnyTimerSpecificActivityBesidesMetronomeRunning,
  isMetronomeActiveValue,
  setIsLooperPlaying,
  setIsMetronomeActive,
  setIsPlaying,
  toggleMetronomeWhenRecordingValue,
  triggerLooperStateUpdate,
  tryToggleInterval,
} from "../../store/settingsSlice";
import { LooperRecorder } from "./looperRecorder";
import {
  checkLooperPlaying,
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

export const looperState: LooperState = [];

export const clearLooperState = () => {
  looperState.forEach(initializeChannel);
  stopMetronomeIfNeeded(store.dispatch);
};

export const stopLooperPlayback = () => {
  currentlyPlayingLooperChannels.clear();
  store.dispatch(setIsPlaying(false));
  looperState.forEach((looperChannel) => {
    looperChannel.isPlaying = false;
    looperChannel.looperRecorder.stopPlaying();
  });
  tryToggleInterval(false);
  stopMetronomeIfNeeded(store.dispatch);
  store.dispatch(triggerLooperStateUpdate()); // this will update all the buttons in the looper panel
  store.dispatch(setIsLooperPlaying(false)); // this will show the pause button
};

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

  if (value) {
    // start recording
    // stop playing in the current channel
    looperChannel.isRecording = true;
    setPlayingInLooperChannel(channel, false);
    setCurrentlyRecordingLooperChannel(channel);
    looperChannel.looperRecorder.startRecording();
    tryToggleInterval(true);
  } else {
    // stop recording
    stopRecording(looperChannel);
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
    store.dispatch(setIsPlaying(true));
    store.dispatch(setIsLooperPlaying(true)); // this will hide the pause button
    void looperChannel.looperRecorder?.startPlaying(); // don't wait for it
  } else {
    if (!looperChannel.isPlaying) {
      // doesn't play - nothing to stop
      return;
    }
    currentlyPlayingLooperChannels.delete(channel);
    if (!checkLooperPlaying()) {
      store.dispatch(setIsPlaying(false));
      store.dispatch(setIsLooperPlaying(false)); // this will show the pause button
    }
    looperChannel.looperRecorder.stopPlaying();
    tryToggleInterval(false);
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
    const channel = looperState.length - 1;
    const looperChannel = looperState[channel];
    initializeChannel(looperChannel, channel);
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

export const stopMetronomeIfNeeded = (dispatch: Dispatch<UnknownAction>) => {
  if (
    toggleMetronomeWhenRecordingValue &&
    isMetronomeActiveValue &&
    !isAnyTimerSpecificActivityBesidesMetronomeRunning()
  ) {
    dispatch(setIsMetronomeActive(false));
  }
};

export const startMetronomeIfNeeded = (dispatch: Dispatch<UnknownAction>) => {
  if (toggleMetronomeWhenRecordingValue && !isMetronomeActiveValue) {
    dispatch(setIsMetronomeActive(true));
  }
};

const initializeChannel = (
  looperChannel: LooperChannelState,
  channel: number
) => {
  setPlayingInLooperChannel(channel, false);
  looperChannel.looperRecorder.clear();
  looperChannel.hasRecording = false;
  stopRecording(looperChannel);
  // we need to explicitly check if interval should be stopped
  tryToggleInterval(false);
};

const createChannelState = () => {
  return {
    isRecording: false,
    isPlaying: false,
    looperRecorder: new LooperRecorder(),
    hasRecording: false,
  };
};

const stopRecording = (looperChannel: LooperChannelState) => {
  // stop recording
  looperChannel.isRecording = false;
  setCurrentlyRecordingLooperChannel(undefined);
  looperChannel.looperRecorder.stopRecording();
};

// init
for (let i = 0; i < LOOPER_CHANNEL_INITIAL_COUNT; i++) {
  looperState.push(createChannelState());
}
