"use client";

import {
  selectControlPanel,
  setSettingsExpanded,
} from "@/app/store/controlPanelSlice";
import dynamic from "next/dynamic";
import { FC, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

// only load Settings module when expanded
const SettingsView = dynamic(
  async () => (await import("./SettingsView")).SettingsView
);

interface SettingsViewWrapperProps {}

export const SettingsViewWrapper: FC<SettingsViewWrapperProps> = ({}) => {
  const settingsRef = useRef<HTMLDivElement>(null);
  const { settingsExpanded } = useSelector(selectControlPanel);
  const dispatch = useDispatch();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        let target = event.target as Node | null;
        let isInsideOpenSettingsButton = false;

        // make sure we don't click on the open-settings-button too as it opens the view back
        while (target && target !== document) {
          if (target === document.getElementById("open-settings-button")) {
            isInsideOpenSettingsButton = true;
            break;
          }
          target = target.parentNode;
        }

        if (!isInsideOpenSettingsButton) {
          // Clicked outside of settings and not on or within the open-settings-button, hide the settings
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

  if (!settingsExpanded) {
    return null;
  }

  return <SettingsView ref={settingsRef} />;
};
