import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import React, { FC, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// only load Settings module when expanded
const SettingsView = React.lazy(() =>
  import("./SettingsView").then((module) => ({ default: module.SettingsView }))
);

// TODO: refactor - extract this in a shared component to reuse with strumming settings and check other usages of setOpened
export const SettingsViewWrapper: FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const [opened, setOpened] = useState(false);
  const { settingsExpanded } = useSelector(selectUi);
  useEffect(() => {
    if (settingsExpanded) {
      setOpened(true);
    }
  }, [settingsExpanded]);

  if (!opened) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <SettingsView premiumComponents={premiumComponents} />
    </Suspense>
  );
};
