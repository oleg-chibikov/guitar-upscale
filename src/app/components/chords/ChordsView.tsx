import { Expander } from "@/app/components/layout/Expander";
import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import { ChordMode, NoteChordMode, getChordName } from "@/app/data/chordModes";
import {
  ChordsDisplayMode,
  MIN_HEIGHT_TO_SHOW_LARGE_CHORDS,
} from "@/app/data/chordsDisplayMode";
import { CHORDS_VIEW_EXPANDER_ID, CHORDS_VIEW_ID } from "@/app/data/elementIds";
import { SHARP_NOTE_COUNT, isSharp } from "@/app/data/notes";
import { Theme } from "@/app/data/theme";
import { isAnyStrummingClicked } from "@/app/engine/strummingState";
import { trailingDebounce } from "@/app/helpers/debounce";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { selectSettings } from "@/app/store/settingsSlice";
import { selectUi, setChordsExpanded } from "@/app/store/uiSlice";
import { RefObject, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordButton } from "./ChordButton";

const TOP_RESERVED_HEIGHT = 80;
const HORIZONTAL_RESERVED_WIDTH = 400;
const COMPACT_CHORDS_WIDTH = 220;

export const ChordsView: React.FC<{ mainRef: RefObject<HTMLElement> }> = ({
  mainRef,
}) => {
  const { chords } = useSelector(selectSettings);
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
    const debouncedHandleResize = trailingDebounce(handleResize, 200);
    setupScrollbar();

    window.addEventListener("resize", debouncedHandleResize);
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!chords) {
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
      id={CHORDS_VIEW_ID}
      className={`opacity-95 fixed touch-none ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      } z-20 bottom-1 ${
        theme === Theme.Light
          ? "bg-accented_background-light"
          : "bg-accented_background-dark"
      } p-1`}
    >
      <Expander
        expanded={chordsExpanded}
        expandOnlyOnIcon={chordsExpanded} // if the chords are expanded - it's usually very easy to accidentally collapse them while playing. therefore we allow collapsing only on icon tap rather than the whole summary header
        handleExpansion={handleExpansion}
        id={CHORDS_VIEW_EXPANDER_ID}
        title="Chords"
      >
        <section
          ref={ref}
          className={`${
            scrollBarVisible ? "overscroll-contain" : "touch-none"
          } overflow-auto`}
          style={{
            maxWidth:
              height < MIN_HEIGHT_TO_SHOW_LARGE_CHORDS
                ? COMPACT_CHORDS_WIDTH
                : Math.max(130, width - HORIZONTAL_RESERVED_WIDTH), // when height is large there's enough space under the guitar to show full chords. It should also leave enough space for the other components on the page (auth header on the top and aspect ratio slider on the side)
            maxHeight: Math.min(330, height - TOP_RESERVED_HEIGHT),
          }}
        >
          <div
            className={`grid grid-cols-2 gap-0.5`}
            style={{
              gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
              gridTemplateRows: `repeat(${totalRows}, 1fr)`,
            }}
          >
            {chords.flatMap((noteChord) =>
              noteChord.modes.map((noteChordMode) => {
                const isHidden =
                  checkIsHiddenMode(noteChordMode) ||
                  (!useSharpChords && isSharp(noteChord.note));
                const title = getChordName(noteChord.note, noteChordMode.mode);

                return (
                  <ChordButton
                    key={title}
                    isHidden={isHidden}
                    noteChordMode={noteChordMode}
                    chordName={title}
                    onStrummingClickedChange={(value) => {
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
              })
            )}
          </div>
          {scrollBarVisible && <div className="w-full h-5"></div>}
        </section>
      </Expander>
    </section>
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
