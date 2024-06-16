import { LazyLoadWrapper } from "@/app/components/layout/LazyLoadWrapper";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import dynamic from "next/dynamic";
import { FC } from "react";

const SettingsView = dynamic(
  async () => (await import("./SettingsView")).SettingsView
);

export const SettingsViewWrapper: FC<WithPremiumComponents> = ({
  premiumComponents,
}) => (
  <LazyLoadWrapper
    renderComponent={() => (
      <SettingsView premiumComponents={premiumComponents} />
    )}
    selector={(state) => selectUi(state).settingsExpanded}
  />
);
