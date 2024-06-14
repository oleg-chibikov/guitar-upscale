"use client";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi } from "@/app/store/uiSlice";
import React, { FC, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// only load module when expanded
const StrummingSettings = React.lazy(() =>
  import("./StrummingSettings").then((module) => ({
    default: module.StrummingSettings,
  }))
);

export const StrummingSettingsWrapper: FC<WithPremiumComponents> = () => {
  const [opened, setOpened] = useState(false);
  const { strummingSettingsExpanded } = useSelector(selectUi);
  useEffect(() => {
    if (strummingSettingsExpanded) {
      setOpened(true);
    }
  }, [strummingSettingsExpanded]);

  if (!opened) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <StrummingSettings />
    </Suspense>
  );
};
