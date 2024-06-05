import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import { ChordMode, NoteChordMode, getModeText } from "@/app/data/chordModes";
import {
  ChordsDisplayMode,
  MIN_HEIGHT_TO_SHOW_LARGE_CHORDS,
} from "@/app/data/chordsDisplayMode";
import { SHARP_NOTE_COUNT, getNoteText } from "@/app/data/notes";
import { Theme } from "@/app/data/theme";
import { trailingDebounce } from "@/app/helpers/debounce";
import { selectSettings } from "@/app/store/settingsSlice";
import { selectUi, setChordsExpanded } from "@/app/store/uiSlice";
import ExpandLess from "@mui/icons-material/ExpandLess";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordButton } from "./ChordButton";

const AUTH_PANEL_RESERVED_HEIGHT = 110;
const ASPECT_RATIO_HORIZONTAL_SLIDER_RESERVED_WIDTH = 400;
const COMPACT_CHORDS_WIDTH = 220;

export const ChordsView: React.FC = () => {
  const { neck, chords } = useSelector(selectSettings);
  const {
    theme,
    chordsExpanded,
    chordsDisplayMode,
    useAdvancedChords,
    useSharpChords,
  } = useSelector(selectUi);
  const dispatch = useDispatch();
  const { premiumFeatures } = usePremiumFeatures();
  const handleExpansion = () => {
    dispatch(setChordsExpanded(!chordsExpanded));
  };

  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [scrollBarVisible, setScrollBarVisible] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  const getScrollbarVisible = () => {
    const el = ref.current;

    return el
      ? el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
      : false;
  };

  const setupScrollbar = () => {
    // I have no idea why it works only with setTimeout. Without it it gives the previous values of dimensions
    setTimeout(() => {
      setScrollBarVisible(getScrollbarVisible());
    }, 1);
  };

  useEffect(setupScrollbar, [useAdvancedChords, useSharpChords]);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
      setupScrollbar();
    };
    const debouncedHandeResize = trailingDebounce(handleResize, 200);
    setupScrollbar();

    window.addEventListener("resize", debouncedHandeResize);
    return () => {
      window.removeEventListener("resize", debouncedHandeResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!neck || !chords) {
    return null;
  }

  const hasAdvancedChords = useAdvancedChords
    ? premiumFeatures.advancedChords === true
    : false; // TODO: so-so protection:)

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
      id="chords-view"
      className={`opacity-95 fixed touch-none ${
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
          className="flex flex-col gap-2"
          style={{
            padding: 0,
            paddingTop: 10, // give area to tap top chords
          }}
        >
          <section
            ref={ref}
            className={`grid ${
              scrollBarVisible ? "overscroll-contain" : "touch-none"
            } gap-0.5 overflow-auto grid-cols-2`}
            style={{
              maxWidth:
                height < MIN_HEIGHT_TO_SHOW_LARGE_CHORDS
                  ? COMPACT_CHORDS_WIDTH
                  : Math.max(
                      130,
                      width - ASPECT_RATIO_HORIZONTAL_SLIDER_RESERVED_WIDTH
                    ), // when height is large there's enough space under the guitar to show full chords. It should also leave enough space for the other components on the page (auth header on the top and aspect ratio slider on the side)
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
          </section>
        </AccordionDetails>
      </Accordion>
    </section>
  );
};
