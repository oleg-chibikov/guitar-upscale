"use client";
import { AlertType } from "@/app/data/alertType";
import { getExampleName, getNewSongName } from "@/app/data/example";
import { RecordTarget } from "@/app/data/recordTarget";
import { playheadTick$ } from "@/app/engine/pianoRoll/playhead";
import {
  pianoRollData,
  setPianoRollData,
} from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { LoadedSong, useLoadedSong } from "@/app/hooks/useLoadedSong";
import {
  isAnyTimerSpecificActivityBesidesMetronomeRunning,
  isMetronomeActiveValue,
  isPlayingValue,
  isRecordingValue,
  saveMidiImmediatelyValue,
  setIsMetronomeActive,
  setIsRecording,
  setNowPlaying,
  setRecordTarget,
  toggleMetronomeWhenRecordingValue,
  tryToggleInterval,
} from "@/app/store/settingsSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import Cancel from "@mui/icons-material/Cancel";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import LibraryMusic from "@mui/icons-material/LibraryMusic";
import PlaylistAdd from "@mui/icons-material/PlaylistAdd";
import StopCircle from "@mui/icons-material/StopCircle";
import {
  Badge,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from "@mui/material";
import React, { Dispatch, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { UnknownAction } from "redux";
import { ConfirmationDialog } from "../uiFramework/ConfirmationDialog";
import { IconButtonWrapper } from "../uiFramework/IconButton";

const LOG_PREFIX = "RecordButton: ";

// the song the take goes into as new tracks. Undefined makes a new song
let trackTarget: LoadedSong | undefined;
let recordingStartedAt = 0;
// a shorter take drops without asking
const CONFIRM_CANCEL_AFTER_MS = 3000;

async function startRecording(
  dispatch: Dispatch<UnknownAction>,
  target: LoadedSong | undefined,
) {
  const { midiRecorder } =
    await import("@/app/engine/midiRecorder/midiRecorder");
  trackTarget = target;
  recordingStartedAt = Date.now();
  dispatch(setIsRecording(true));
  tryToggleInterval(true);
  if (target) {
    // the take lines up with the song under the playhead
    midiRecorder.startRecording(() => playheadTick$.value);
    if (!isPlayingValue) {
      const { playMidi } = await import("@/app/engine/midiPlayer");
      void playMidi(dispatch, target.data, LOG_PREFIX, () =>
        dispatch(setNowPlaying(target.name)),
      );
    }
  } else {
    midiRecorder.startRecording();
  }
  if (toggleMetronomeWhenRecordingValue && !isMetronomeActiveValue) {
    dispatch(setIsMetronomeActive(true));
  }
}

async function stopRecording(dispatch: Dispatch<UnknownAction>, save: boolean) {
  if (!isRecordingValue) {
    return;
  }
  const { midiRecorder } =
    await import("@/app/engine/midiRecorder/midiRecorder");
  const target = trackTarget;
  trackTarget = undefined;
  dispatch(setIsRecording(false));
  tryToggleInterval(false);
  const take = midiRecorder.stopRecording(save && saveMidiImmediatelyValue);
  if (
    toggleMetronomeWhenRecordingValue &&
    isMetronomeActiveValue &&
    !isAnyTimerSpecificActivityBesidesMetronomeRunning()
  ) {
    // only stop metronome when there is no other playing activity
    dispatch(setIsMetronomeActive(false));
  }
  if (!save) {
    return;
  }
  if (take?.hasItems !== true) {
    dispatch(
      setAndShowAlert({
        message: "The take has no notes, so it isn't saved",
        alertType: AlertType.Neutral,
      }),
    );
    return;
  }

  if (target) {
    const { addRecordedTracks } =
      await import("@/app/engine/pianoRoll/recordedTracks");
    addRecordedTracks(target.data, take);
    if (pianoRollData === target.data) {
      // the piano roll and the download button pick up the new tracks
      setPianoRollData(target.data, dispatch);
    }
    dispatch(
      setAndShowAlert({
        message: `Added the take to ${target.name}`,
        alertType: AlertType.Success,
      }),
    );
    return;
  }

  if (isPlayingValue) {
    const { stopPlayback } = await import("@/app/engine/midiPlayer");
    await stopPlayback(dispatch, LOG_PREFIX);
  }
  const { addNewSong } = await import("@/app/engine/songs/songLibrary");
  const saved = await addNewSong(take, getNewSongName("Recording"));
  setPianoRollData(take, dispatch);
  dispatch(
    setAndShowAlert({
      message: `Saved ${getExampleName(saved)} to the song list`,
      alertType: AlertType.Success,
    }),
  );
}

export const RecordButton: React.FC = (props) => {
  const isRecording = useSettingsSelector((s) => s.isRecording);
  const isPlaying = useSettingsSelector((s) => s.isPlaying);
  const recordTarget = useSettingsSelector((s) => s.recordTarget);
  const loadedSong = useLoadedSong();
  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // the start time of the take the cancel dialog is for
  const [confirmCancelFor, setConfirmCancelFor] = useState<number>();
  const intoTrack = recordTarget === RecordTarget.NewTrack && !!loadedSong;

  // a take over a song ends with the song
  const sawPlaying = useRef(false);
  useEffect(() => {
    if (!isRecording) {
      sawPlaying.current = false;
    } else if (isPlaying) {
      sawPlaying.current = true;
    } else if (sawPlaying.current && trackTarget) {
      void stopRecording(dispatch, true);
    }
  }, [isRecording, isPlaying, dispatch]);

  const record = (target: RecordTarget) => {
    setMenuAnchor(null);
    if (target !== recordTarget) {
      dispatch(setRecordTarget(target));
    }
    void startRecording(
      dispatch,
      target === RecordTarget.NewTrack ? loadedSong : undefined,
    );
  };

  const recordIcon = intoTrack ? (
    <Badge
      badgeContent="+"
      color="primary"
      overlap="circular"
      sx={{
        "& .MuiBadge-badge": {
          height: 14,
          minWidth: 14,
          padding: 0,
          fontSize: 12,
          fontWeight: "bold",
        },
      }}
    >
      <FiberManualRecord />
    </Badge>
  ) : (
    <FiberManualRecord />
  );

  return (
    <>
      {isRecording && (
        <IconButtonWrapper
          {...props}
          icon={<Cancel />}
          isActive={true}
          tooltip="Cancel recording"
          onPress={() => {
            if (Date.now() - recordingStartedAt > CONFIRM_CANCEL_AFTER_MS) {
              setConfirmCancelFor(recordingStartedAt);
            } else {
              void stopRecording(dispatch, false);
            }
          }}
        />
      )}
      <ConfirmationDialog
        open={isRecording && confirmCancelFor === recordingStartedAt}
        onClose={() => setConfirmCancelFor(undefined)}
        onConfirm={() => {
          setConfirmCancelFor(undefined);
          void stopRecording(dispatch, false);
        }}
        title="Drop this take?"
        content="The notes you just played won't be saved."
        confirmButtonText="Drop take"
      />
      <IconButtonWrapper
        {...props}
        icon={isRecording ? <StopCircle /> : recordIcon}
        isActive={isRecording}
        tooltip={
          isRecording
            ? "Stop recording and save"
            : intoTrack
              ? `Record a new track in ${loadedSong.name}. Hold to choose`
              : "Record a new song. Hold to choose"
        }
        activeBg="error"
        inactiveBg="error"
        onPress={() =>
          isRecording
            ? void stopRecording(dispatch, true)
            : record(intoTrack ? RecordTarget.NewTrack : RecordTarget.NewSong)
        }
        onLongPress={isRecording ? undefined : setMenuAnchor}
      />
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <ListSubheader sx={{ lineHeight: "32px" }}>Record</ListSubheader>
        <MenuItem
          dense
          selected={!intoTrack}
          onClick={() => record(RecordTarget.NewSong)}
        >
          <ListItemIcon>
            <LibraryMusic fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="A new song"
            secondary="Goes to the song list"
          />
        </MenuItem>
        <MenuItem
          dense
          selected={intoTrack}
          disabled={!loadedSong}
          onClick={() => record(RecordTarget.NewTrack)}
        >
          <ListItemIcon>
            <PlaylistAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="A new track in this song"
            secondary={
              loadedSong
                ? `Plays along with ${loadedSong.name}`
                : "Load a song first"
            }
            slotProps={{ secondary: { noWrap: true, sx: { maxWidth: 240 } } }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};
