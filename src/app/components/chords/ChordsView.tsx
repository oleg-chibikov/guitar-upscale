import { Expander } from "@/app/components/uiFramework/Expander";
import {
  ChordsDisplayMode,
  MIN_HEIGHT_TO_SHOW_LARGE_CHORDS,
} from "@/app/data/chordsDisplayMode";
import { CHORDS_VIEW_ID } from "@/app/data/elementIds";
import { NOTE_COUNT, SHARP_NOTE_COUNT } from "@/app/data/notes";
import {
  clearChordDetector,
  rebuildChordDetectorLookup,
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
import {
  addChordMode,
  capoValue,
  incrementChordModesCount,
  initChords,
  neckValue,
  selectSettings,
  setChordIsBeingDetected,
} from "@/app/store/settingsSlice";
import { selectUi, setChordsExpanded } from "@/app/store/uiSlice";
import { RefObject, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordButton } from "./ChordButton";

const TOP_RESERVED_HEIGHT = 80;
const HORIZONTAL_RESERVED_WIDTH = 600;
const COMPACT_CHORDS_WIDTH = 220;

export const ChordsView: React.FC<{ mainRef: RefObject<HTMLElement> }> = ({
  mainRef,
}) => {
  // unique number for each chordGeneration. This helps with aborting the proper chordGeneration execution
  const localGuitarSettingsUpdateCount = useRef<number>(0);

  const { chordModesCount, guitarSettingsUpdateCount } =
    useSelector(selectSettings);

  const { chordsExpanded, chordsDisplayMode, useSharpChords } =
    useSelector(selectUi);

  const dispatch = useDispatch();
  useEffect(() => {
    if (!neckValue) {
      return;
    }
    if (
      guitarSettingsUpdateCount === undefined ||
      localGuitarSettingsUpdateCount.current === guitarSettingsUpdateCount
    ) {
      return;
    }

    // it will stop any current processing
    abortGeneratingChords(localGuitarSettingsUpdateCount.current);

    localGuitarSettingsUpdateCount.current = guitarSettingsUpdateCount;
    chordNotesByName.clear();
    dispatch(initChords());

    // TODO: Prevent chord detection / midi upload until chords are built
    // TODO: For midi upload as we change scale we will have to wait for this to finish
    // Passing true for useAdvancedChords to generate them all (in order to play in examples). But the user can show them only being premium
    generateChords(
      neckValue,
      capoValue,
      localGuitarSettingsUpdateCount.current,
      (chordModeVariationsContainer) => {
        addChordMode(chordModeVariationsContainer.chordModeVariations);
        setPreferredVariationsForChordMode(chordModeVariationsContainer);
        dispatch(incrementChordModesCount());
      },
      () => {
        clearChordDetector?.();
        dispatch(setChordIsBeingDetected(false));
        rebuildChordDetectorLookup();
      }
    );
  }, [dispatch, guitarSettingsUpdateCount]);

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

  useEffect(setupScrollbar, [useSharpChords]);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
      setupScrollbar();
    };
    const debouncedHandleResize = trailingDebounce(handleResize, 200);
    setupScrollbar();

    window.addEventListener("resize", debouncedHandleResize);
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (chordModesCount === 0) {
    return null;
  }

  const totalRows = NOTE_COUNT - (useSharpChords ? 0 : SHARP_NOTE_COUNT);

  return (
    <Expander
      id={CHORDS_VIEW_ID}
      className={`opacity-95 fixed touch-none ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      } z-20 bottom-1`}
      expanded={chordsExpanded}
      expandOnlyOnIcon={chordsExpanded} // if the chords are expanded - it's usually very easy to accidentally collapse them while playing. therefore we allow collapsing only on icon tap rather than the whole summary header
      handleExpansion={handleExpansion}
      title="Chords"
    >
      <section
        ref={ref}
        className={`grid grid-cols-2 gap-0.5 ${
          scrollBarVisible ? "overscroll-contain" : "touch-none"
        } overflow-auto`}
        style={{
          maxWidth:
            height < MIN_HEIGHT_TO_SHOW_LARGE_CHORDS
              ? COMPACT_CHORDS_WIDTH
              : Math.max(130, width - HORIZONTAL_RESERVED_WIDTH), // when height is large there's enough space under the guitar to show full chords. It should also leave enough space for the other components on the page (auth header on the top and aspect ratio slider on the side)
          maxHeight: Math.min(330, height - TOP_RESERVED_HEIGHT),
          gridTemplateColumns: `repeat(${chordModesCount}, 1fr)`,
          gridTemplateRows: `repeat(${totalRows}, 1fr)`,
        }}
      >
        {Array.from({ length: totalRows }).map((_, rowIndex) =>
          Array.from({ length: chordModesCount }).map((_, columnIndex) => (
            <ChordButton
              key={rowIndex + "_" + columnIndex}
              chordModeIndex={columnIndex}
              note={rowIndex}
              onStrummingStateChange={(value) => {
                if (!isMobileDeviceValue) {
                  return;
                }
                const isStrummingClicked = value || isAnyStrummingClicked();
                toggleOverflow(isStrummingClicked, ref);
                toggleOverflow(isStrummingClicked, mainRef);
              }}
            />
          ))
        )}
      </section>
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
