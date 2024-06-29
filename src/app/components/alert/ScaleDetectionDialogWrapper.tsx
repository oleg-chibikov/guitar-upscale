import { LazyLoadWrapper } from "@/app/components/layout/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";

const ScaleDetectionAlert = dynamic(
  async () => (await import("./ScaleDetectionDialog")).ScaleDetectionAlert
);

export const ScaleDetectionDialogWrapper: FC = () => (
  <LazyLoadWrapper
    renderComponent={() => <ScaleDetectionAlert />}
    selector={(state) => selectUi(state).showScalesAlert}
  />
);
