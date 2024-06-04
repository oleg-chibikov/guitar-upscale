"use client";
import { IconButton } from "@/app/components/settings/buttons/IconButton";
import { parseMidiData } from "@/app/engine/midiParser";
import { MidiPlayer } from "@/app/engine/midiPlayer";
import { asyncTimeout } from "@/app/helpers/asyncTimeout";
import { useChordDetectorSetup } from "@/app/hooks/useChordDetectorSetup";
import {
  isPlayingValue,
  setIsPlaying,
  setTempoBpm,
} from "@/app/store/settingsSlice";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { read } from "midifile-ts";
import React, { Fragment, useRef } from "react";
import { useDispatch } from "react-redux";

export const MidiUploadButton: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const setupChordDetector = useChordDetectorSetup();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Processing midi file");
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        console.log("File loaded");
        if (event.target?.result) {
          const arrayBuffer = event.target.result as ArrayBuffer;
          await setupChordDetector();
          const byteArray = new Uint8Array(arrayBuffer);
          const midiData = read(byteArray);
          const eventsByTick = await parseMidiData(midiData, (bpm) => {
            dispatch(setTempoBpm({ tempo: bpm, updateInterval: true }));
          });

          if (!eventsByTick.hasItems) {
            return;
          }
          const midiPlayer = new MidiPlayer(eventsByTick);

          const playMidi = async () => {
            dispatch(setIsPlaying(true));
            await midiPlayer.play();
            dispatch(setIsPlaying(false));
          };
          // stop current playback
          if (isPlayingValue) {
            dispatch(setIsPlaying(false));
            // a timeout is needed to properly stop the current playback
            await asyncTimeout(playMidi, 1);
          } else {
            await playMidi();
          }
        } else {
          console.warn("No result in onload handler");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.warn("No midi file selected");
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
        icon={<UploadFileIcon />}
        onPress={() => {
          ref.current?.click();
        }}
        tooltip={"Play midi file"}
      ></IconButton>
    </Fragment>
  );
};
