import { toggleInterval } from "../store/settingsSlice";
import {
  currentlyPlayingLooperChannels,
  currentlyRecordingLooperChannel,
  setCurrentlyRecordingLooperChannel,
} from "./looperShared";
import { MidiRecorder } from "./midiRecorder";

export const LOOPER_CHANNEL_COUNT = 4;

export type LooperChannelState = {
  isPlaying: boolean;
  isRecording: boolean;
  midiRecorder: MidiRecorder;
};

export type LooperState = LooperChannelState[];

export const looperState: LooperState = Array.from(
  { length: LOOPER_CHANNEL_COUNT },
  () => ({
    isRecording: false,
    isPlaying: false,
    midiRecorder: new MidiRecorder(),
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
    looperChannel.midiRecorder.startRecording();
    toggleInterval(true);
  } else {
    // stop recording
    setCurrentlyRecordingLooperChannel(undefined);
    looperChannel.midiRecorder.stopRecordingWithoutClearing();
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
    if (!looperChannel.midiRecorder.hasRecording()) {
      return;
    }

    currentlyPlayingLooperChannels.add(channel);
    toggleInterval(true);
    void looperChannel.midiRecorder.playMidi(); // don't wait for it
    //TODO: repeat until stopped
  } else {
    if (!looperChannel.isPlaying) {
      // doesn't play - nothing to stop
      return;
    }
    currentlyPlayingLooperChannels.delete(channel);
    looperChannel.midiRecorder.stopPlaying();
    toggleInterval(false);
  }
  looperChannel.isPlaying = value;
};
