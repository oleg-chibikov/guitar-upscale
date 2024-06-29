import { LazyLoadWrapper } from "@/app/components/uiFramework/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";
import { useSelector } from "react-redux";

const StrummingSettings = dynamic(
  async () => (await import("./StrummingSettings")).StrummingSettings
);

export const StrummingSettingsWrapper: FC = () => {
  const { strummingSettingsExpanded } = useSelector(selectUi);
  return (
    <LazyLoadWrapper
      renderComponent={() => <StrummingSettings />}
      isOpen={strummingSettingsExpanded}
    />
  );
};
