import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getHexValue } from "../helpers/colorHelper";
import { getAssetsForSkin } from "../helpers/skinHelper";
import { hideAlert, init } from "../store/controlPanelSlice";
import { RootState } from "../store/store";
import { AnimatedAlert } from "./AnimatedAlert";
import { Fretboard } from "./Fretboard";
import { ControlPanel } from "./settings/ControlPanel";

export const Main = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(init());
  }, [dispatch]);

  const [highResLoaded, setHighResLoaded] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  const {
    showAlert: isAlertShown,
    alertMessage,
    mainBg,
    fretboardScaleX,
    fretboardScaleY,
    skin,
  } = useSelector((state: RootState) => state.controlPanel);

  const [retrigger, setRetrigger] = useState<boolean>(false);

  useEffect(() => {
    const bgHex = getHexValue(mainBg);
    if (bgHex) {
      document.body.style.backgroundColor = bgHex;
      // TODO: Check
    }
  }, [mainBg]);

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
    setRetrigger(true);
    setTimeout(() => setRetrigger(false), 1);
  }, [fretboardScaleX, fretboardScaleY]);

  useEffect(() => {
    setHighResLoaded(false);
  }, [skin]);

  const handleCloseAlert = () => {
    dispatch(hideAlert());
  };

  const assets = getAssetsForSkin(skin);

  if (retrigger) {
    return (
      <div
        className={`min-w-full min-h-full items-start justify-center ${mainBg}`}
      ></div>
    );
  }

  // TODO: Close menu on touch anywhere else
  return (
    <div>
      {isAlertShown && (
        <AnimatedAlert message={alertMessage} onClose={handleCloseAlert} />
      )}

      <ControlPanel />
      <div
        className={`min-w-full min-h-full items-start justify-center ${mainBg}`}
      >
        <Fretboard
          scaleFactor={scaleFactor}
          imageSource={assets[1]}
          onImageLoaded={() => {
            console.log("Loaded full res image");
            setHighResLoaded(true);
          }}
          isCollapsed={!highResLoaded}
        />
      </div>
    </div>
  );
};
