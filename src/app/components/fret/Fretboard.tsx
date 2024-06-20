import { MIN_HEIGHT_TO_SHOW_LARGE_CHORDS } from "@/app/data/chordsDisplayMode";
import { FRETBOARD } from "@/app/data/elementIds";
import { Skin } from "@/app/data/skin";
import { FRET_COUNT } from "@/app/engine/generateNeckRepresentation";
import { useScreenOrientation } from "@/app/engine/useScreenOrientation";
import { trailingDebounce } from "@/app/helpers/debounce";
import { interpolate } from "@/app/helpers/interpolation";
import { getAssetsForSkin } from "@/app/helpers/skinHelper";
import { selectSettings } from "@/app/store/settingsSlice";
import { selectUi } from "@/app/store/uiSlice";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Fretline } from "./Fretline";
import { GuitarImage } from "./GuitarImage";

const getPositionForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    case undefined:
      return {
        top: -583,
        left: -455,
        xShift: 450,
      };
    case Skin.Ibanez_AE140_WKH:
      return {
        top: -589,
        left: -544,
        xShift: 520,
      };
    case Skin.Yamaha_CSF3M:
      return {
        top: -573,
        left: -465,
        xShift: 450,
      };
    case Skin.Yamaha_SLG200NW:
      return {
        top: -567,
        left: -520,
        xShift: 450,
      };
  }
};

export const Fretboard: React.FC = () => {
  const {
    skin,
    fretboardScaleX,
    fretboardScaleY,
    chordsExpanded,
    useAdvancedChords,
  } = useSelector(selectUi);
  const { neck } = useSelector(selectSettings);
  // const [highResLoaded, setHighResLoaded] = useState(false);
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [position, setPosition] = useState(getPositionForSkin(skin));
  const orientation = useScreenOrientation();

  const [retrigger, setRetrigger] = useState<boolean>(false);

  useEffect(() => {
    setRetrigger(true);
    setTimeout(() => setRetrigger(false), 1);
  }, [fretboardScaleX, fretboardScaleY]);

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
      setWidth(window.innerWidth);
    };

    const debouncedHandeResize = trailingDebounce(handleResize, 200);

    window.addEventListener("resize", debouncedHandeResize);
    return () => {
      window.removeEventListener("resize", debouncedHandeResize);
    };
  }, []);

  const repostion = useCallback(() => {
    const scrollX = interpolate(fretboardScaleX, 1, 2.2, 500, 0); // max value is 3 but setting 2 gives better outcome
    const scrollY = interpolate(fretboardScaleY, 0.7, 1, 100, 40);
    // scroll a bit right and up to see the notes straight away
    setTimeout(() => {
      // doesn't apply well without timeout
      window.scrollTo(scrollX, scrollY);
    }, 200);
  }, [fretboardScaleX, fretboardScaleY]);

  useEffect(repostion, [repostion, orientation]);

  // useEffect(() => {
  //   setHighResLoaded(false);
  // }, [skin]);

  useEffect(() => {
    const skinPosition = getPositionForSkin(skin);
    setPosition(skinPosition);
  }, [skin]);

  if (!neck) {
    return null;
  }
  // retriggering is needed to refresh scrollbars, otherwise they stay not updated
  if (retrigger) {
    return null;
  }

  const assets = getAssetsForSkin(skin);

  const isHeightEnoughToShowLargeChords =
    height >= MIN_HEIGHT_TO_SHOW_LARGE_CHORDS;

  const needYShift = chordsExpanded && isHeightEnoughToShowLargeChords;

  return (
    <section
      className={`flex flex-col origin-top-left min-w-full items-start justify-center`}
      style={{
        height:
          height * fretboardScaleY +
          (isHeightEnoughToShowLargeChords ? -100 : 100),
        transform: `scaleX(${1 / fretboardScaleX}) scaleY(${
          1 / fretboardScaleY
        })`,
      }}
    >
      <div
        className={"flex relative flex-col items-start z-10"}
        style={{
          left:
            position.xShift +
            (useAdvancedChords && !isHeightEnoughToShowLargeChords ? 250 : 0),
          top: needYShift ? -100 : 0,
        }}
      >
        <div
          className={`absolute overflow-hidden overscroll-contain origin-top-left`}
          style={{
            ...position,
            maxWidth:
              Math.max(width * fretboardScaleX, 2000) -
              position.left -
              12 * fretboardScaleX,
            maxHeight:
              Math.max((height - 380) * fretboardScaleY, 400) -
              position.top +
              (needYShift ? 160 : 0),
          }}
        >
          {/* {!highResLoaded && <GuitarImage asset={assets[0]} />} */}
          <GuitarImage
            // className={!highResLoaded ? "collapse" : undefined}
            asset={
              "https://cdn.statically.io/gh/oleg-chibikov/guitar-upscale-assets/main" +
              assets[1]
            }
            // onLoad={() => {
            //   if (!highResLoaded) {
            //     console.log("Loaded full res image");
            //     setHighResLoaded(true);
            //   }
            // }}
          />
        </div>
        <div id={FRETBOARD}>
          {/* Header */}
          <Fretline
            isHeader
            elements={Array.from({ length: FRET_COUNT + 1 }, (_, index) => ({
              note: index,
              octave: 4,
              string: 0,
              fret: index,
            }))}
          />
          {/* Notes */}
          <div className="mt-10">
            {neck.map((row, rowIndex) => (
              <Fretline
                string={rowIndex}
                key={rowIndex}
                elements={row}
                isHeader={false}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
