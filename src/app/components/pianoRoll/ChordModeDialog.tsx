import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { getChordName } from "@/app/data/chordModes";
import { getNoteText } from "@/app/data/notes";
import { fromPitch } from "@/app/engine/pianoRoll/geometry";
import { setChordMode } from "@/app/engine/pianoRoll/operations";
import {
  getChordModeName,
  getChordModesForPitch,
  getEventPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import { playChordOrNote } from "@/app/engine/playerHelper";
import { Alert, Button } from "@mui/material";
import React from "react";

export const PIANO_ROLL_CHORD_DIALOG = "piano-roll-chord-dialog";

/**
 * Lists the chord modes the generator has for the chord's root
 */
export const ChordModeDialog: React.FC = () => {
  const { data, chordToChoose, closeChordChoice, apply } = usePianoRoll();
  const state = chordToChoose !== undefined ? data?.getEvent(chordToChoose) : undefined;
  const event = state?.event;

  if (!data || !event?.chord) {
    return null;
  }

  const pitch = getEventPitch(event);
  const root = fromPitch(pitch).note;
  const currentMode = getChordModeName(event);
  const modes = getChordModesForPitch(pitch);

  return (
    <DialogWrapper
      isOpen
      close={closeChordChoice}
      headerText={`Chords on ${getNoteText(root)}`}
      id={PIANO_ROLL_CHORD_DIALOG}
    >
      {modes.length === 0 ? (
        <Alert severity="warning">
          No chords on this note with the current chord settings. Move the
          chord to another note or turn on more chord modes.
        </Alert>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
          {modes.map((mode) => {
            const name = getChordName(root, mode);
            return (
              <Button
                key={mode.name}
                variant={mode.name === currentMode ? "contained" : "outlined"}
                title={mode.description}
                onClick={() => {
                  const result = setChordMode(data, event.id, mode);
                  apply(result);
                  const changed = data.getEvent(event.id);
                  if (changed) playChordOrNote(changed.event);
                  closeChordChoice();
                }}
                sx={{ textTransform: "none" }}
              >
                {name}
              </Button>
            );
          })}
        </div>
      )}
    </DialogWrapper>
  );
};
