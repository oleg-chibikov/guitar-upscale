import { AlertType } from "@/app/data/alertType";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { usePianoRollData } from "@/app/hooks/usePianoRollData";
import { setAndShowAlert } from "@/app/store/uiSlice";
import Download from "@mui/icons-material/Download";
import { ListItemText, Menu, MenuItem } from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

const downloadMidi = async (data: EventsByTick) => {
  const midiRecorder = (await import("@/app/engine/midiRecorder/midiRecorder"))
    .midiRecorder;
  midiRecorder.startRecording();
  midiRecorder.initializeStartTick(0);
  midiRecorder.addEvents(data);
  midiRecorder.stopRecording(true);
};

const downloadGuitarPro = async (data: EventsByTick) => {
  const { getExampleForEvents } = await import(
    "@/app/engine/songs/songLibrary"
  );
  const { downloadEventsAsGuitarPro } = await import(
    "@/app/engine/songs/songExport"
  );
  await downloadEventsAsGuitarPro(data, getExampleForEvents(data));
};

export const DownloadButton: React.FC = () => {
  const dataToPlay = usePianoRollData();
  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  if (dataToPlay === undefined) {
    return null;
  }

  const download = async (save: (data: EventsByTick) => Promise<void>) => {
    setMenuAnchor(null);
    try {
      await save(dataToPlay);
    } catch (error) {
      console.error("Cannot download the song", error);
      dispatch(
        setAndShowAlert({
          message: "Cannot download the song",
          alertType: AlertType.Error,
        })
      );
    }
  };

  return (
    <>
      <IconButtonWrapper
        tooltip="Download as Guitar Pro (hold for MIDI)"
        icon={<Download />}
        onPress={() => void download(downloadGuitarPro)}
        onLongPress={setMenuAnchor}
      />
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem dense onClick={() => void download(downloadGuitarPro)}>
          <ListItemText primary="Guitar Pro (.gp)" />
        </MenuItem>
        <MenuItem dense onClick={() => void download(downloadMidi)}>
          <ListItemText primary="MIDI (.mid)" />
        </MenuItem>
      </Menu>
    </>
  );
};
