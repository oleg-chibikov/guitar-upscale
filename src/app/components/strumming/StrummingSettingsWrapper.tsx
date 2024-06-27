import { LazyLoadWrapper } from "@/app/components/layout/LazyLoadWrapper";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";

const StrummingSettings = dynamic(
  async () => (await import("./StrummingSettings")).StrummingSettings
);

export const StrummingSettingsWrapper: FC = () => (
  <LazyLoadWrapper
    renderComponent={() => <StrummingSettings />}
    selector={(state) => selectUi(state).strummingSettingsExpanded}
  />
);
