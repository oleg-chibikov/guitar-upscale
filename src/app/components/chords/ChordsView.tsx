import { SlashChordButtonsContainer } from "@/app/components/chords/SlashChordButtonsContainer";
import { Expander } from "@/app/components/uiFramework/Expander";
import { ChordModeVariations, getChordName } from "@/app/data/chordModes";
import {
  ChordsDisplayMode,
  MIN_HEIGHT_TO_SHOW_LARGE_CHORDS,
} from "@/app/data/chordsDisplayMode";
import { CHORDS_VIEW_ID } from "@/app/data/elementIds";
import { NOTE_COUNT, SHARP_NOTE_COUNT, isSharp } from "@/app/data/notes";
import {
  addChordsToDetectorLookup,
  clearChordDetector,
} from "@/app/engine/chords/chordLookupBuilder";
import {
  chordNotesByName,
  setPreferredVariationsForChordMode,
} from "@/app/engine/chords/chordNotesByName";
import {
  abortGeneratingChords,
  generateChords,
} from "@/app/engine/chords/chordsGeneratorWorkerApi";
import { isAnyStrummingClicked } from "@/app/engine/strummingState";
import { trailingDebounce } from "@/app/helpers/debounce";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import {
  addChordMode,
  capoValue,
  chordsValue,
  neckValue,
  setChordIsBeingDetected,
  setChordsAreLoading,
} from "@/app/store/settingsSlice";
import { setChordsExpanded } from "@/app/store/uiSlice";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ChordButton } from "./ChordButton";

const TOP_RESERVED_HEIGHT = 100;
const HORIZONTAL_RESERVED_WIDTH = 600;
const COMPACT_CHORDS_WIDTH = 220;

export const ChordsView: React.FC<{ mainRef: RefObject<HTMLElement> }> = ({
  mainRef,
}) => {
  const guitarSettingsUpdateCount = useSettingsSelector(
    (s) => s.guitarSettingsUpdateCount
  );
  const chordDetectorAvailable = useSettingsSelector(
    (s) => s.chordDetectorAvailable
  );

  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [chordModeVariations, setChordModeVariations] = useState<
    ChordModeVariations[]
  >([]);

  // unique number for each chordGeneration. This helps avoiding running this code twice in dev mode
  const localGuitarSettingsUpdateCount = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const useSharpChords = useUiSelector((s) => s.useSharpChords);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const chordsExpanded = useUiSelector((s) => s.chordsExpanded);

  const dispatch = useDispatch();
  const handleExpansion = () => {
    dispatch(setChordsExpanded(!chordsExpanded));
  };

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
      const { chordDetectorWorkerApi } = await import(
        "@/app/engine/chords/chordDetectorWorkerApi"
      );

      abortGeneratingChords();

      localGuitarSettingsUpdateCount.current = guitarSettingsUpdateCount;
      // chord detector needs these values to build slash chords
      chordDetectorWorkerApi.setNeckAndCapo(neckValue, capoValue);
      chordNotesByName.clear();
      chordsValue.length = 0; // clear chordsValue;
      setChordModeVariations([]);
      dispatch(setChordsAreLoading(true));

      generateChords(
        neckValue,
        capoValue,
        (chordModeVariationsContainer) => {
          addChordMode(chordModeVariationsContainer.chordModeVariations);
          setPreferredVariationsForChordMode(chordModeVariationsContainer);
          setChordModeVariations([...chordsValue]);

          addChordsToDetectorLookup?.(
            chordModeVariationsContainer.chordModeVariations
          );
        },
        () => {
          clearChordDetector?.();
          dispatch(setChordIsBeingDetected(false));
          dispatch(setChordsAreLoading(false));
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const totalColumns = chordModeVariations.length;
  if (totalColumns === 0) {
    return null;
  }

  const totalRows = NOTE_COUNT - (useSharpChords ? 0 : SHARP_NOTE_COUNT);

  return (
    <Expander
      id={CHORDS_VIEW_ID}
      className={`opacity-95 fixed ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      } z-20 bottom-1`}
      expanded={chordsExpanded}
      expandOnlyOnIcon={chordsExpanded} // if the chords are expanded - it's usually very easy to accidentally collapse them while playing. therefore we allow collapsing only on icon tap rather than the whole summary header
      handleExpansion={handleExpansion}
      title="Chords"
    >
      <div className="relative flex flex-row gap-0.5">
        <SlashChordButtonsContainer />

        <section
          ref={ref}
          className={`grid gap-0.5 overscroll-contain overflow-auto`}
          style={{
            maxWidth:
              height < MIN_HEIGHT_TO_SHOW_LARGE_CHORDS
                ? COMPACT_CHORDS_WIDTH
                : Math.max(130, width - HORIZONTAL_RESERVED_WIDTH), // when height is large there's enough space under the guitar to show full chords. It should also leave enough space for the other components on the page (auth header on the top and aspect ratio slider on the side)
            maxHeight: Math.min(330, height - TOP_RESERVED_HEIGHT),
            gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
            gridTemplateRows: `repeat(${totalRows}, 1fr)`,
          }}
        >
          {Array.from({ length: NOTE_COUNT }).map((_, noteIndex) => (
            <React.Fragment key={noteIndex}>
              {chordModeVariations.map((chordMode) => {
                const title = getChordName(noteIndex, chordMode.chordMode);
                const isHidden = !useSharpChords && isSharp(noteIndex);
                return (
                  <ChordButton
                    key={title}
                    isHidden={isHidden}
                    variations={chordMode.variationsByNote[noteIndex] ?? []}
                    chordName={title}
                    onStrummingStateChange={(value) => {
                      if (!isMobileDeviceValue) {
                        return;
                      }
                      const isStrummingClicked =
                        value || isAnyStrummingClicked();
                      toggleOverflow(isStrummingClicked, ref);
                      toggleOverflow(isStrummingClicked, mainRef);
                    }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </section>
      </div>
    </Expander>
  );
};

function toggleOverflow(
  isStrummingClicked: boolean,
  ref: RefObject<HTMLElement>
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
