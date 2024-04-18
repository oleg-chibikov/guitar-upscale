"use client";
import { useScreenOrientation } from "@/app/engine/useScreenOrientation";
import { interpolate } from "@/app/helpers/interpolation";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NOTE_COUNT } from "../../engine/generateNeckRepresentation";
import { getAssetsForSkin } from "../../helpers/skinHelper";
import { Skin } from "../../store/controlPanelSlice";
import { RootState } from "../../store/store";
import { Fretline } from "./Fretline";
import { GuitarImage } from "./GuitarImage";

const getPositionForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    case undefined:
      return {
        top: -583,
        left: 0,
      };
    case Skin.Ibanez_AE140_WKH:
      return {
        top: -589,
        left: -88,
      };
    case Skin.Yamaha_CSF3M:
      return {
        top: -573,
        left: -9,
      };
    case Skin.Yamaha_SLG200NW:
      return {
        top: -567,
        left: -65,
      };
  }
};

export const Fretboard: React.FC = () => {
  const { skin, neck, fretboardScaleX, fretboardScaleY } = useSelector(
    (state: RootState) => state.controlPanel
  );
  // const [highResLoaded, setHighResLoaded] = useState(false);
  const [maxHeight, setMaxHeight] = useState(window.innerHeight);
  const [maxWidth, setMaxWidth] = useState(window.innerWidth);
  const [position, setPosition] = useState(getPositionForSkin(skin));
  const orientation = useScreenOrientation();

  const [retrigger, setRetrigger] = useState<boolean>(false);

  useEffect(() => {
    setRetrigger(true);
    setTimeout(() => setRetrigger(false), 1);
  }, [fretboardScaleX, fretboardScaleY]);

  useEffect(() => {
    const handleResize = () => {
      setMaxHeight(window.innerHeight);
      setMaxWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // Call handleResize initially to calculate scaleFactor
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const repostion = useCallback(() => {
    const scrollX = interpolate(fretboardScaleX, 1, 2, 300, 0); // max value is 3 but setting 2 gives better outcome
    const scrollY = interpolate(fretboardScaleY, 0.7, 1, 100, 0);
    // scroll a bit right to see the notes straight away
    window.scrollTo(scrollX, scrollY); // values are x,y-offset
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

  return (
    <section
      className={`flex flex-col mt-24 mb-24 origin-top-left min-w-full min-h-full items-start justify-start`}
      style={{
        transform: `scaleX(${1 / fretboardScaleX}) scaleY(${
          1 / fretboardScaleY
        })`,
      }}
    >
      <>
        <div
          className={"flex relative flex-col items-start z-10"}
          style={{
            left: 456,
          }}
        >
          {/* Header */}
          <Fretline
            isHeader
            elements={Array.from(
              { length: NOTE_COUNT * 2 + 1 },
              (_, index) => ({
                note: index,
                octave: 4,
                string: 0,
                fret: index,
              })
            )}
          />
          {/* Notes */}
          <div className="mt-10">
            {neck.map((row, rowIndex) => (
              <Fretline string={rowIndex} key={rowIndex} elements={row} />
            ))}
          </div>
        </div>
        <div
          className={`absolute overflow-hidden`}
          style={{
            ...position,
            maxWidth:
              Math.max(maxWidth * fretboardScaleX, 2500) - position.left,
            maxHeight:
              Math.max((maxHeight - 120) * fretboardScaleY, 400) - position.top,
          }}
        >
          {/* {!highResLoaded && <GuitarImage asset={assets[0]} />} */}
          <GuitarImage
            // className={!highResLoaded ? "collapse" : undefined}
            asset={assets[1]}
            // onLoad={() => {
            //   if (!highResLoaded) {
            //     console.log("Loaded full res image");
            //     setHighResLoaded(true);
            //   }
            // }}
          />
        </div>
      </>
    </section>
  );
};
