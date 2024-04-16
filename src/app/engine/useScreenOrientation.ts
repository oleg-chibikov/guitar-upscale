import { useEffect, useState } from "react";

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

    window.addEventListener("resize", handleResize);
    checkOrientation(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return orientation;
};
