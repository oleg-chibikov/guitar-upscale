import {
  CHORDS_VIEW_ID,
  SETTINGS_PANEL_ID,
  STRUMMING_PATTERN_EDITOR,
  STRUMMING_SETTINGS_PANEL_ID,
} from "@/app/data/elementIds";
import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUi,
  setSettingsExpanded,
  setStrummingSettingsExpanded,
} from "../store/uiSlice";

export const MenuOutsideClickHandler: FC = () => {
  const { settingsExpanded, strummingSettingsExpanded } = useSelector(selectUi);
  const dispatch = useDispatch();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let target = event.target as Node | null;
      let isInsideButton = false;
      let isInsideSettings = false;
      let isInsideStrummingSettings = false;

      // if the user clicks on any button or on chords - don't hide the settings, use standard action for this button
      while (target && target !== document) {
        const id = (target as HTMLElement)?.getAttribute("id");
        if (
          target.nodeName === "BUTTON" ||
          id === CHORDS_VIEW_ID ||
          id === STRUMMING_PATTERN_EDITOR
        ) {
          isInsideButton = true;
          break;
        }
        if (id === SETTINGS_PANEL_ID) {
          isInsideSettings = true;
          break;
        } else if (id === STRUMMING_SETTINGS_PANEL_ID) {
          isInsideStrummingSettings = true;
          break;
        }

        target = target.parentNode;
      }

      if (!isInsideButton) {
        if (!isInsideSettings) {
          // Clicked outside of settings and not on or within the button, hide the settings
          dispatch(setSettingsExpanded(false));
        }
        if (!isInsideStrummingSettings) {
          dispatch(setStrummingSettingsExpanded(false));
        }
      }
    };

    if (settingsExpanded || strummingSettingsExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch, settingsExpanded, strummingSettingsExpanded]);
  return null;
};
