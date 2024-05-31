import { IconButton } from "@/app/components/settings/buttons/IconButton";
import { parseMidiData } from "@/app/engine/midiParser";
import { MidiPlayer } from "@/app/engine/midiPlayer";
import { setIsPlaying } from "@/app/store/settingsSlice";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { read } from "midifile-ts";
import React, { Fragment } from "react";
import { useDispatch } from "react-redux";

interface MidiEvent {
  note: number;
  track: number;
  velocity: number;
  position: number;
}

export const MidiUpload: React.FC = () => {
  const dispatch = useDispatch();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const arrayBuffer = event.target.result as ArrayBuffer;
          const byteArray = new Uint8Array(arrayBuffer);
          const midiData = read(byteArray);
          const eventsByTick = await parseMidiData(midiData);

          if (eventsByTick.size > 0) {
            dispatch(setIsPlaying(true));
            const midiPlayer = new MidiPlayer(eventsByTick);
            await midiPlayer.play();
            dispatch(setIsPlaying(false));
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Fragment>
      <input
        className="hidden"
        accept=".mid"
        id="icon-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <IconButton
        icon={<UploadFileIcon />}
        onPress={() => {
          document.getElementById("icon-button-file")?.click();
        }}
        tooltip={"Play midi file"}
      ></IconButton>
    </Fragment>
  );
};
