import { SlashChordButtonsContainer } from "@/app/components/chords/SlashChordButtonsContainer";
import { Expander } from "@/app/components/uiFramework/Expander";
import { ChordModeVariations, getChordName } from "@/app/data/chordModes";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import {
  ChordsDisplayMode,
  MIN_HEIGHT_TO_SHOW_LARGE_CHORDS,
} from "@/app/data/chordsDisplayMode";
import { CHORDS_VIEW_ID } from "@/app/data/elementIds";
import { NOTE_COUNT, isSharp } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import {
  addChordsToDetectorLookup,
  clearChordDetector,
} from "@/app/engine/chords/chordLookupBuilder";
import {
  resetChordModesForNotes,
  setChordModeForNotes,
} from "@/app/engine/chords/chordModesByNote";
import {
  chordPreferredVariationsByName,
  setPreferredVariationsForChordMode,
} from "@/app/engine/chords/chordNotesByName";
import {
  abortGeneratingChords,
  generateChords,
} from "@/app/engine/chords/chordsGeneratorWorkerApi";
import { isAnyStrummingClicked } from "@/app/engine/strummingState";
import { trailingDebounce } from "@/app/helpers/debounce";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { NO_LONG_PRESS_ATTRIBUTE } from "@/app/helpers/longPressBlocker";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { useInputChecker } from "@/app/hooks/useInputChecker";
import {
  capoValue,
  chordPlayModeValue,
  neckValue,
  setChordIsBeingDetected,
  setChordsAreLoading,
} from "@/app/store/settingsSlice";
import { setAllChordsShown, setChordsExpanded } from "@/app/store/uiSlice";
import { Button } from "@mui/material";
import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ChordButton } from "./ChordButton";
import {
  ChordGrid,
  KEY_CELL_HEIGHT,
  LARGE_CELL_HEIGHT,
  SMALL_CELL_HEIGHT,
} from "./ChordGrid";
import { buildAllChordsLayout, buildKeyChordsLayout } from "./chordGridLayout";
import { ChordGridStore } from "./chordGridStore";

const TOP_RESERVED_HEIGHT = 100;
// the screen edge under the bottom bar and the gap above it
const BOTTOM_BAR_MARGIN = 8;
const HORIZONTAL_RESERVED_WIDTH = 600;
const COMPACT_CHORDS_WIDTH = 220;
const CHORDS_RENDER_INTERVAL_MS = 150;

export const ChordsView: React.FC<{
  mainRef: RefObject<HTMLElement | null>;
}> = ({ mainRef }) => {
  const guitarSettingsUpdateCount = useSettingsSelector(
    (s) => s.guitarSettingsUpdateCount,
  );
  const chordDetectorAvailable = useSettingsSelector(
    (s) => s.chordDetectorAvailable,
  );
  const chordsAreLoading = useSettingsSelector((s) => s.chordsAreLoading);
  const chordPlayMode = useSettingsSelector((s) => s.chordPlayMode);

  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [chordModeVariations, setChordModeVariations] = useState<
    ChordModeVariations[]
  >([]);

  const chordModeVariationsRef = useRef<ChordModeVariations[]>([]);
  const renderTimerRef = useRef<number | undefined>(undefined);

  // The grid re-renders once per batch of chord modes. A render per mode blocked the page for most of the load.
  const renderChordModeVariations = (immediately: boolean) => {
    if (immediately) {
      window.clearTimeout(renderTimerRef.current);
      renderTimerRef.current = undefined;
      setChordModeVariations([...chordModeVariationsRef.current]);
      return;
    }
    renderTimerRef.current ??= window.setTimeout(() => {
      renderTimerRef.current = undefined;
      setChordModeVariations([...chordModeVariationsRef.current]);
    }, CHORDS_RENDER_INTERVAL_MS);
  };

  useEffect(() => () => window.clearTimeout(renderTimerRef.current), []);

  // unique number for each chordGeneration. This helps avoiding running this code twice in dev mode
  const localGuitarSettingsUpdateCount = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const store = useMemo(() => new ChordGridStore(), []);
  const useSharpChords = useUiSelector((s) => s.useSharpChords);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const chordsExpanded = useUiSelector((s) => s.chordsExpanded);
  const allChordsShown = useUiSelector((s) => s.allChordsShown);
  const bottomBarHeight = useUiSelector((s) => s.bottomBarHeight);
  const capo = useSettingsSelector((s) => s.capo);
  const tuning = useSettingsSelector((s) => s.tuning);
  const slashChordBassNote = useSettingsSelector((s) => s.slashChordBassNote);
  const hasTouchInput = useInputChecker();

  const dispatch = useDispatch();
  const handleExpansion = () => {
    dispatch(setChordsExpanded(!chordsExpanded));
  };

  useEffect(() => {
    if (chordsAreLoading) {
      return; // don't switch it while chords are loaded - preferred variations will be updated once they are loaded
    }
    regeneratePreferredVariationsForAllModes(
      chordModeVariationsRef.current,
      chordPlayMode,
    );
  }, [chordPlayMode, chordsAreLoading]);

  useEffect(() => {
    const setNewChords = async () => {
      if (chordDetectorAvailable === undefined) {
        // start generating chords only once we know if chords detector is available or not and its module is loaded
        return;
      }
      if (!neckValue) {
        return;
      }
      if (
        guitarSettingsUpdateCount === undefined ||
        localGuitarSettingsUpdateCount.current === guitarSettingsUpdateCount
      ) {
        return;
      }
      const { chordDetectorWorkerApi } =
        await import("@/app/engine/chords/chordDetectorWorkerApi");

      abortGeneratingChords();

      localGuitarSettingsUpdateCount.current = guitarSettingsUpdateCount;
      // chord detector needs these values to build slash chords
      chordDetectorWorkerApi.setNeckAndCapo(neckValue, capoValue);
      chordPreferredVariationsByName.clear();
      resetChordModesForNotes();
      chordModeVariationsRef.current = [];
      renderChordModeVariations(true);
      dispatch(setChordsAreLoading(true));
      const chordPlayModeBeforeGeneration = chordPlayModeValue;

      generateChords(
        neckValue,
        capoValue,
        (variations) => {
          chordModeVariationsRef.current.push(variations);
          renderChordModeVariations(false);

          setPreferredVariationsForChordMode(
            variations,
            chordPlayModeBeforeGeneration,
          );
          setChordModeForNotes(variations);
          addChordsToDetectorLookup?.(variations);
        },
        () => {
          renderChordModeVariations(true);
          clearChordDetector?.();
          dispatch(setChordIsBeingDetected(false));
          dispatch(setChordsAreLoading(false));

          // if the chord play mode has changed while chords were being generated - update the preferred variations according to the new value
          if (chordPlayModeValue !== chordPlayModeBeforeGeneration) {
            regeneratePreferredVariationsForAllModes(
              chordModeVariationsRef.current,
              chordPlayModeValue,
            );
          }
        },
      );
    };

    void setNewChords();
  }, [dispatch, guitarSettingsUpdateCount, chordDetectorAvailable]);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
    };
    const debouncedHandleResize = trailingDebounce(handleResize, 200);

    window.addEventListener("resize", debouncedHandleResize);
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  }, []);

  const totalColumns = chordModeVariations.length;
  if (totalColumns === 0) {
    return null;
  }

  const notes = Array.from({ length: NOTE_COUNT }, (_, note) => note).filter(
    (note) => useSharpChords || !isSharp(note),
  );
  const layout = allChordsShown
    ? buildAllChordsLayout(chordModeVariations, notes)
    : buildKeyChordsLayout(chordModeVariations, getShiftedNote(capo, tuning));
  const cellHeight = !allChordsShown
    ? KEY_CELL_HEIGHT
    : useSharpChords
      ? SMALL_CELL_HEIGHT
      : LARGE_CELL_HEIGHT;

  return (
    <Expander
      id={CHORDS_VIEW_ID}
      className={`fixed opacity-95 ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      } z-20`}
      style={{ bottom: bottomBarHeight + BOTTOM_BAR_MARGIN }}
      expanded={chordsExpanded}
      expandOnlyOnIcon={chordsExpanded} // if the chords are expanded - it's usually very easy to accidentally collapse them while playing. therefore we allow collapsing only on icon tap rather than the whole summary header
      handleExpansion={handleExpansion}
      title="Chords"
      headerAction={
        chordsExpanded ? (
          <Button
            component="span"
            size="small"
            sx={{
              minWidth: 0,
              py: 0,
              lineHeight: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
            onClick={() => dispatch(setAllChordsShown(!allChordsShown))}
          >
            {allChordsShown ? "In key" : "All chords"}
          </Button>
        ) : undefined
      }
    >
      <div className="relative flex flex-row gap-0.5">
        {(allChordsShown || slashChordBassNote !== undefined) && (
          <SlashChordButtonsContainer />
        )}

        <section
          ref={ref}
          {...{ [NO_LONG_PRESS_ATTRIBUTE]: true }}
          className={`overflow-auto overscroll-contain`}
          style={{
            maxWidth:
              height < MIN_HEIGHT_TO_SHOW_LARGE_CHORDS
                ? COMPACT_CHORDS_WIDTH
                : Math.max(130, width - HORIZONTAL_RESERVED_WIDTH), // when height is large there's enough space under the guitar to show full chords. It should also leave enough space for the other components on the page (auth header on the top and aspect ratio slider on the side)
            maxHeight: Math.min(
              330,
              height - TOP_RESERVED_HEIGHT - bottomBarHeight,
            ),
          }}
        >
          <ChordGrid
            layout={layout}
            cellHeight={cellHeight}
            store={store}
            scrollerRef={ref}
            hasTouchInput={hasTouchInput}
            bassNote={slashChordBassNote}
          />
        </section>
        {Array.from({ length: NOTE_COUNT }).map((_, noteIndex) =>
          chordModeVariations.map((chordMode) => {
            const title = getChordName(noteIndex, chordMode.chordMode);
            return (
              <ChordButton
                key={title}
                store={store}
                isHidden={
                  allChordsShown && !useSharpChords && isSharp(noteIndex)
                }
                chordMode={chordMode.chordMode}
                note={noteIndex}
                variations={chordMode.variationsByNote[noteIndex] ?? []}
                chordName={title}
                onStrummingStateChange={(value) => {
                  if (!isMobileDeviceValue) {
                    return;
                  }
                  const isStrummingClicked = value || isAnyStrummingClicked();
                  toggleOverflow(isStrummingClicked, ref);
                  toggleOverflow(isStrummingClicked, mainRef);
                }}
              />
            );
          }),
        )}
      </div>
    </Expander>
  );
};

function regeneratePreferredVariationsForAllModes(
  chordModeVariations: ChordModeVariations[],
  chordPlayMode: ChordPlayMode,
) {
  chordPreferredVariationsByName.clear();
  chordModeVariations.forEach((variations) => {
    setPreferredVariationsForChordMode(variations, chordPlayMode);
  });
}

function toggleOverflow(
  isStrummingClicked: boolean,
  ref: RefObject<HTMLElement | null>,
) {
  if (isStrummingClicked) {
    // only allow scrolling when nothing is strumming. It's inconvenient when the scrolling is enabled while strumming - easy to unintentionally scroll
    ref.current?.classList.remove("overflow-auto");
    ref.current?.classList.add("overflow-hidden");
  } else {
    ref.current?.classList.add("overflow-auto");
    ref.current?.classList.remove("overflow-hidden");
  }
}
