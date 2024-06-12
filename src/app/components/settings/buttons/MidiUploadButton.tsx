"use client";
import { IconButton } from "@/app/components/settings/buttons/IconButton";
import { parseMidiData } from "@/app/engine/midiParser/midiParser";
import { useChordDetectorSetup } from "@/app/hooks/useChordDetectorSetup";
import { setTempoBpm } from "@/app/store/settingsSlice";
import UploadFile from "@mui/icons-material/UploadFile";
import React, { Fragment, useRef } from "react";
import { useDispatch } from "react-redux";
const LOG_PREFIX = "Midi upload button: ";
export const MidiUploadButton: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const setupChordDetector = useChordDetectorSetup();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(LOG_PREFIX + "Processing midi file");
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        console.log(LOG_PREFIX + "File loaded");
        if (event.target?.result) {
          await setupChordDetector();
          const eventsByTick = await parseMidiData(
            event.target.result as ArrayBuffer,
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
        id="icon-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <IconButton
        icon={<UploadFile />}
        onPress={() => {
          ref.current?.click();
        }}
        tooltip={"Play midi file"}
      ></IconButton>
    </Fragment>
  );
};
