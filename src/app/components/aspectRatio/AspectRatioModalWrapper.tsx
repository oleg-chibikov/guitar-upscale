import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";
import { useSelector } from "react-redux";

const AspectRatioModal = dynamic(
  async () => (await import("./AspectRatioModal")).AspectRatioModal
);

export const AspectRatioModalWrapper: FC = () => {
  const { showAspectRatio } = useSelector(selectUi);
  return (
    <LazyLoadWrapper
      renderComponent={() => <AspectRatioModal />}
      isOpen={showAspectRatio}
    />
  );
};
