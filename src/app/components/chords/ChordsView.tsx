"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SHARP_NOTE_COUNT, getNoteText } from "../../data/notes";

import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { selectUi, setChordsExpanded } from "@/app/store/uiSlice";
import ExpandLess from "@mui/icons-material/ExpandLess";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import {
  ChordMode,
  NoteChordMode,
  getModeText,
} from "../../engine/chordsGenerator";
import { useInputChecker } from "../../helpers/useInputChecker";
import { selectSettings } from "../../store/settingsSlice";
import { ChordButton } from "./ChordButton";

const authPanelHeightReserved = 110;

export const ChordsView: React.FC = () => {
  const { neck, useAdvancedChords, useSharpChords, chords } =
    useSelector(selectSettings);
  const { theme, chordsExpanded, chordsDisplayMode } = useSelector(selectUi);
  const dispatch = useDispatch();
  const premiumFeatures = usePremiumFeatures();
  const handleExpansion = () => {
    dispatch(setChordsExpanded(!chordsExpanded));
  };

  const [height, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // it's ergonomic to display chords vertically for touch devices in order to play with right hand
  const hasTouchInput = useInputChecker();

  if (!neck || !chords) {
    return null;
  }

  const hasAdvancedChords = useAdvancedChords && premiumFeatures.advancedChords; // TODO: so-so protection:)

  const checkIsHiddenMode = (noteChordMode: NoteChordMode) =>
    !hasAdvancedChords &&
    noteChordMode.mode !== ChordMode.Major &&
    noteChordMode.mode !== ChordMode.Minor;

  const totalRows = chords.length - (useSharpChords ? 0 : SHARP_NOTE_COUNT);
  const totalColumns = chords[0].modes.filter(
    (x) => !checkIsHiddenMode(x)
  ).length;

  return (
    <section
      className={`opacity-95 fixed ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      } z-20 bottom-1 ${
        theme === Theme.Light
          ? "bg-accented_background-light"
          : "bg-accented_background-dark"
      } p-1`}
    >
      <Accordion
        expanded={chordsExpanded}
        onChange={handleExpansion}
        // slots={{ transition: Fade as AccordionSlots["transition"] }}
        // slotProps={{ transition: { timeout: 400 } }}
        sx={{
          "& .MuiAccordionSummary-content": {
            margin: 0,
            marginY: 0.5,
          },
        }}
        disableGutters
      >
        <AccordionSummary
          expandIcon={<ExpandLess />}
          style={{
            minHeight: 0,
          }}
          id="panel-header"
          aria-controls="panel-content"
        >
          Chords
        </AccordionSummary>
        <AccordionDetails
          className={`grid gap-0.5 overflow-auto ${
            !hasTouchInput ? "grid-cols-2" : "grid-rows-2"
          }`}
          style={{
            padding: 4,
            paddingTop: 10, // give area to tap top chords
            maxWidth: hasTouchInput && height < 700 ? 220 : "100vw", // when height is 700+ there's enough space under the guitar to show full chords
            maxHeight: height - authPanelHeightReserved,
            gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
            gridTemplateRows: `repeat(${totalRows}, 1fr)`,
          }}
        >
          {chords.flatMap((noteChord) =>
            noteChord.modes.map((noteChordMode) => {
              const text = getNoteText(noteChord.note);
              const isHidden =
                checkIsHiddenMode(noteChordMode) ||
                (!useSharpChords && text.endsWith("#"));
              const title = text + getModeText(noteChordMode.mode);

              return (
                <ChordButton
                  key={title}
                  isHidden={isHidden}
                  noteChordMode={noteChordMode}
                  chordName={title}
                />
              );
            })
          )}
        </AccordionDetails>
      </Accordion>
    </section>
  );
};
