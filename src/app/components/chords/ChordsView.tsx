"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SHARP_NOTE_COUNT, getNoteText } from "../../data/notes";

import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import {
  ChordsDisplayMode,
  MIN_HEIGHT_TO_SHOW_LARGE_CHORDS,
} from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { selectUi, setChordsExpanded } from "@/app/store/uiSlice";
import ExpandLess from "@mui/icons-material/ExpandLess";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import {
  ChordMode,
  NoteChordMode,
  getModeText,
} from "../../engine/chordsGenerator";
import { selectSettings } from "../../store/settingsSlice";
import { ChordButton } from "./ChordButton";

const AUTH_PANEL_RESERVED_HEIGHT = 110;
const ASSPECT_RATIO_HORIZONTAL_SLIDER_RESERVED_WIDTH = 230;
const COMPACT_CHORDS_WIDTH = 220;

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
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
          className={`grid gap-0.5 overflow-auto grid-cols-2`}
          style={{
            padding: 4,
            paddingTop: 10, // give area to tap top chords
            maxWidth:
              height < MIN_HEIGHT_TO_SHOW_LARGE_CHORDS
                ? COMPACT_CHORDS_WIDTH
                : width - ASSPECT_RATIO_HORIZONTAL_SLIDER_RESERVED_WIDTH, // when height is large there's enough space under the guitar to show full chords. It should also leave enough space for the other components on the page (auth header on the top and aspect ratio slider on the side)
            maxHeight: Math.min(330, height - AUTH_PANEL_RESERVED_HEIGHT),
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
