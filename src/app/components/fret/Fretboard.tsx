import { MIN_HEIGHT_TO_SHOW_LARGE_CHORDS } from "@/app/data/chordsDisplayMode";
import { FRETBOARD } from "@/app/data/elementIds";
import { FRET_COUNT } from "@/app/data/notes";
import { trailingDebounce } from "@/app/helpers/debounce";
import { interpolate } from "@/app/helpers/interpolation";
import { NO_LONG_PRESS_ATTRIBUTE } from "@/app/helpers/longPressBlocker";
import { getAssetsForSkin, getPositionForSkin } from "@/app/helpers/skinHelper";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import React, { useEffect, useState } from "react";
import { Fretline } from "./Fretline";
import { GuitarImage } from "./GuitarImage";

export const Fretboard: React.FC = () => {
  const skin = useUiSelector((s) => s.skin);
  const fretboardScaleX = useUiSelector((s) => s.fretboardScaleX);
  const fretboardScaleY = useUiSelector((s) => s.fretboardScaleY);
  const chordsExpanded = useUiSelector((s) => s.chordsExpanded);
  const slashChordsExpanded = useUiSelector((s) => s.slashChordsExpanded);
  const neck = useSettingsSelector((s) => s.neck);
  // const [highResLoaded, setHighResLoaded] = useState(false);
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [position, setPosition] = useState(getPositionForSkin(skin));

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

    const debouncedHandleResize = trailingDebounce(handleResize, 200);

    window.addEventListener("resize", debouncedHandleResize);
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  }, []);

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
      {...{ [NO_LONG_PRESS_ATTRIBUTE]: true }}
      className={`flex flex-col origin-top-left min-w-full items-start justify-center`}
      style={{
        height:
          height * fretboardScaleY +
          (isHeightEnoughToShowLargeChords ? -100 : 0),
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
            (!isHeightEnoughToShowLargeChords
              ? interpolate(
                  fretboardScaleX,
                  1,
                  3,
                  slashChordsExpanded ? -210 : -240,
                  slashChordsExpanded ? 400 : 300
                )
              : 0),
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
              "https://raw.githubusercontent.com/oleg-chibikov/guitar-upscale-assets/main/" +
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
