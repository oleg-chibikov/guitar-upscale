"use client";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { selectUi, setSettingsExpanded } from "@/app/store/uiSlice";
import React, { FC, Suspense, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// only load Settings module when expanded
const SettingsView = React.lazy(() =>
  import("./SettingsView").then((module) => ({ default: module.SettingsView }))
);

export const SettingsViewWrapper: FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const [opened, setOpened] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { settingsExpanded } = useSelector(selectUi);
  useEffect(() => {
    if (settingsExpanded) {
      setOpened(true);
    }
  }, [settingsExpanded]);
  const dispatch = useDispatch();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        let target = event.target as Node | null;
        let isInsideButton = false;

        // if the user clicks on any button or on chords - don't hide the settings, use standard action for this button
        while (target && target !== document) {
          if (
            target.nodeName === "BUTTON" ||
            (target as HTMLElement)?.getAttribute("id") === "chords-view"
          ) {
            isInsideButton = true;
            break;
          }
          target = target.parentNode;
        }

        if (!isInsideButton) {
          // Clicked outside of settings and not on or within the button, hide the settings
          dispatch(setSettingsExpanded(false));
        }
      }
    };

    if (settingsExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch, settingsExpanded]);

  if (!opened) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <SettingsView ref={settingsRef} premiumComponents={premiumComponents} />
    </Suspense>
  );
};
