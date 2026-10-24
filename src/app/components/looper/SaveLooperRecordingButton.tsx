import { AlertType } from "@/app/data/alertType";
import { getExampleName, getNewSongName } from "@/app/data/example";
import { LooperState } from "@/app/engine/looper/looper";
import {
  looperSong,
  setLooperHasUnsavedLoops,
  setLooperSong,
} from "@/app/engine/looper/looperShared";
import { setPianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { setAndShowAlert } from "@/app/store/uiSlice";
import LibraryAdd from "@mui/icons-material/LibraryAdd";
import LibraryAddCheck from "@mui/icons-material/LibraryAddCheck";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

interface SaveLooperRecordingButtonProps {
  state: LooperState;
}

const getRecordedChannels = (state: LooperState) =>
  Object.values(state).filter((channel) => channel.hasRecording);

const downloadMidi = async (state: LooperState) => {
  const { midiRecorder } =
    await import("@/app/engine/midiRecorder/midiRecorder");
  midiRecorder.startRecording();
  midiRecorder.initializeStartTick(0);
  getRecordedChannels(state).forEach(({ looperRecorder }) =>
    looperRecorder.addAllItemsToNoteRecorder(midiRecorder),
  );
  midiRecorder.stopRecording(true);
};

export const SaveLooperRecordingButton: React.FC<
  SaveLooperRecordingButtonProps
> = ({ state }) => {
  const dispatch = useDispatch();
  // the module value changes on a save. This makes the button show it
  const [song, setSong] = useState(looperSong);

  const saveSong = async () => {
    const [{ buildLooperSong, getRecordedLoops }, songLibrary] =
      await Promise.all([
        import("@/app/engine/looper/looperSong"),
        import("@/app/engine/songs/songLibrary"),
      ]);
    const { addNewSong, replaceSongEvents } = songLibrary;
    const events = buildLooperSong(getRecordedLoops(state));
    if (!events.hasItems) {
      return;
    }
    setLooperHasUnsavedLoops(false);
    const saved =
      (looperSong && (await replaceSongEvents(looperSong.id, events))) ??
      (await addNewSong(events, getNewSongName("Loops")));
    const isUpdate = saved.id === looperSong?.id;
    const linked = { id: saved.id, name: getExampleName(saved) };
    setLooperSong(linked);
    setSong(linked);
    setPianoRollData(events, dispatch);
    dispatch(
      setAndShowAlert({
        message: isUpdate
          ? `Updated ${linked.name} with the loops`
          : `Saved the loops to the song list as ${linked.name}`,
        alertType: AlertType.Success,
      }),
    );
  };

  return (
    <IconButtonWrapper
      icon={song ? <LibraryAddCheck /> : <LibraryAdd />}
      isActive={true}
      tooltip={
        song
          ? `Update ${song.name} with the loops (hold for MIDI)`
          : "Save the loops as a song (hold for MIDI)"
      }
      onPress={() => void saveSong()}
      onLongPress={() => void downloadMidi(state)}
    />
  );
};
