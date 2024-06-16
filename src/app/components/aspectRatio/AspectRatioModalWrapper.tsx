import { LazyLoadWrapper } from "@/app/components/layout/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";

const AspectRatioModal = dynamic(
  async () => (await import("./AspectRatioModal")).AspectRatioModal
);

export const AspectRatioModalWrapper: FC = () => (
  <LazyLoadWrapper
    renderComponent={() => <AspectRatioModal />}
    selector={(state) => selectUi(state).showAspectRatio}
  />
);
