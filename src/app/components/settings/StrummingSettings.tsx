"use client";

import { Theme } from "@/app/data/theme";
import { selectUi, setStrummingSettingsExpanded } from "@/app/store/uiSlice";
import { Slide } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";
import { ChordCustomStrummingWaitForPatternFinishCheckbox } from "./checkboxes/ChordCustomStrummingWaitForPatternFinishCheckbox";
import { ChordStrummingIntervalSelector } from "./selectors/ChordStrummingIntervalSelector";
import { StrummingPatternSelector } from "./selectors/StrummingPatternSelector";

interface StrummingSettingsProps {}

export const StrummingSettings: FC<StrummingSettingsProps> = ({}) => {
  const dispatch = useDispatch();
  const { theme, strummingSettingsExpanded } = useSelector(selectUi);

  return (
    <Slide
      direction="up"
      in={strummingSettingsExpanded}
      mountOnEnter
      unmountOnExit
    >
      <section
        id="strumming-settings"
        className={"z-20 fixed bottom-1 left-1/2"}
      >
        <div
          className={`flex flex-col gap-2 translate-x-[-50%] p-4 border-2  ${
            theme === Theme.Light
              ? "bg-accented_background-light border-border-light text-foreground-light"
              : "bg-accented_background-dark  border-border-dark text-foreground-dark"
          }`}
        >
          <CloseIcon
            onPress={() => {
              dispatch(setStrummingSettingsExpanded(false));
            }}
          />
          Long press the chord to strum
          <ChordCustomStrummingWaitForPatternFinishCheckbox />
          <StrummingPatternSelector />
          <ChordStrummingIntervalSelector />
        </div>
      </section>
    </Slide>
  );
};
