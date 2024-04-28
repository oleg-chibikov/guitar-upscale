import { useEffect, useState } from "react";
import { trailingDebounce } from "../helpers/debounce";

export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState(
    window.innerWidth > window.innerHeight ? "landscape" : "portrait"
  );

  const checkOrientation = () => {
    setOrientation(
      window.innerWidth > window.innerHeight ? "landscape" : "portrait"
    );
  };

  useEffect(() => {
    const handleResize = () => {
      checkOrientation();
    };
    checkOrientation(); // Initial check

    const debouncedHandeResize = trailingDebounce(handleResize, 200);

    window.addEventListener("resize", debouncedHandeResize);
    return () => {
      window.removeEventListener("resize", debouncedHandeResize);
    };
  }, []);

  return orientation;
};
