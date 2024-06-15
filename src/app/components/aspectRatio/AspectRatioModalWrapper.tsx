import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// only load module when expanded
const AspectRatioModal = dynamic(
  async () => (await import("./AspectRatioModal")).AspectRatioModal
);

export const AspectRatioModalWrapper: FC = () => {
  const [opened, setOpened] = useState(false);
  const { showAspectRatio } = useSelector(selectUi);
  useEffect(() => {
    if (showAspectRatio) {
      setOpened(true);
    }
  }, [showAspectRatio]);
  if (!opened) {
    return null;
  }

  return <AspectRatioModal />;
};
