import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NoteCount } from "../../engine/generateNeckRepresentation";
import { getAssetsForSkin } from "../../helpers/skinHelper";
import { imageLoader } from "../../imageLoader";
import { Skin } from "../../store/controlPanelSlice";
import { RootState } from "../../store/store";
import { Fretline } from "./Fretline";

const getDimensionsForSkin = (skin?: Skin) => {
  switch (skin) {
    case Skin.PRS_SE_AX20E:
    case undefined:
      return {
        top: -583,
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
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const recalculateScaleFactor = (size: {
    width: number;
    height: number;
    fontScale: number;
  }) => {
    const isLandscape = size.width > size.height;
    const baseScale = 0.5;

    const scaleFactor =
      baseScale +
      (isLandscape
        ? Math.log10(size.width / size.height)
        : Math.log10(size.height / size.width));
    setScaleFactor(scaleFactor * size.fontScale);
  };

  useEffect(() => {
    const handleResize = () => {
      recalculateScaleFactor({
        width: window.innerWidth,
        height: window.innerHeight,
        fontScale: 1, // You may need to adjust this value based on your requirements
      });
    };

    window.addEventListener("resize", handleResize);

    // Call handleResize initially to calculate scaleFactor
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setHighResLoaded(false);
  }, [skin]);

  const assets = getAssetsForSkin(skin);

  if (!neck) {
    return null;
  }

  const dimensions = getDimensionsForSkin(skin);

  return (
    <section
      className={`flex flex-col mt-24 mb-24 origin-top-left min-w-full min-h-full items-start justify-center`}
      style={{
        transform: `scale(${scaleFactor}) scaleX(${
          1 / fretboardScaleX
        }) scaleY(${1 / fretboardScaleY})`,
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
            elements={Array.from({ length: NoteCount * 2 + 1 }, (_, index) => ({
              note: index,
              octave: 4,
              string: 0,
              fret: index,
            }))}
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
            ...dimensions,
            maxWidth: 3000,
            maxHeight: 1300,
          }}
        >
          <Image
            className={`origin-top-left`}
            loader={imageLoader}
            style={{
              maxWidth: "unset",
              width: 5504,
              height: 2200,
              transform: "scale(0.662)", // Scale the image to fit the Fretboard class
            }}
            width={5504}
            height={2200}
            onLoad={() => {
              console.log("Loaded full res image");
              setHighResLoaded(true);
            }}
            src={assets[highResLoaded ? 1 : 0]}
            alt="Guitar"
          />
        </div>
      </>
    </section>
  );
};
