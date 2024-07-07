"use client";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { parseMidiData } from "@/app/engine/midiParser/midiParser";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setTempoBpm } from "@/app/store/settingsSlice";
import UploadFile from "@mui/icons-material/UploadFile";
import React, { Fragment, useRef } from "react";
import { useDispatch } from "react-redux";
const LOG_PREFIX = "Midi upload button: ";
export const MidiUploadButton: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const chordsAreLoading = useSettingsSelector((s) => s.chordsAreLoading);
  const chordDetectorAvailable = useSettingsSelector(
    (s) => s.chordDetectorAvailable
  );
  const scaleDetectorAvailable = useSettingsSelector(
    (s) => s.scaleDetectorAvailable
  );

  const disabled =
    chordsAreLoading ||
    chordDetectorAvailable === undefined ||
    scaleDetectorAvailable === undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      console.warn("Midi upload is not enabled yet");
      return;
    }
    console.log(LOG_PREFIX + "Processing midi file");
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        console.log(LOG_PREFIX + "File loaded");
        const result = event.target?.result;
        if (result !== null && result !== undefined) {
          const eventsByTick = await parseMidiData(
            result as ArrayBuffer,
            (bpm) => {
              dispatch(setTempoBpm({ tempo: bpm, updateInterval: true }));
            }
          );

          if (!eventsByTick.hasItems) {
            return;
          }

          const { playMidi } = await import("@/app/engine/midiPlayer");
          await playMidi(dispatch, eventsByTick, LOG_PREFIX);
        } else {
          console.warn(LOG_PREFIX + "No result in onload handler");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.warn(LOG_PREFIX + "No midi file selected");
    }
    if (ref.current) {
      ref.current.value = ""; // allows selecting the same file
    }
  };

  return (
    <Fragment>
      <input
        ref={ref}
        className="hidden"
        accept=".mid"
        type="file"
        onChange={handleFileChange}
      />
      <IconButtonWrapper
        disabled={disabled}
        icon={<UploadFile />}
        onPress={() => {
          ref.current?.click();
        }}
        tooltip={
          chordsAreLoading
            ? "Wait for the chords to load before playing MIDI"
            : "Play midi file"
        }
      />
    </Fragment>
  );
};
