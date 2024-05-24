"use client";

import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Theme } from "../data/theme";
import { WithPremiumComponents } from "../helpers/WithPremiumFeatures";
import { selectUi } from "../store/uiSlice";
import { GradientCircularProgress } from "./GradientCircularProgress";
import { Initializer } from "./Initializer";
import { MenuOutsideClickHandler } from "./MenuOutsideClickHandler";
import { AlertWrapper } from "./alert/AlertWrapper";
import AuthPanel from "./auth/AuthPanel";
import { ChordsView } from "./chords/ChordsView";
import { Fretboard } from "./fret/Fretboard";
import { AspectRatioControl } from "./settings/AspectRatioControl";
import { ControlPanel } from "./settings/ControlPanel";
import { SettingsViewWrapper } from "./settings/SettingsViewWrapper";
import { StrummingSettings } from "./settings/StrummingSettings";

export const ClientRoot: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { loadingMessage, theme } = useSelector(selectUi);

  return (
    <>
      <Initializer />
      <AlertWrapper />
      {loadingMessage !== undefined ? (
        <main
          className={`flex flex-col gap-2 justify-center align-middle items-center text-center text-2xl ${
            theme === Theme.Light
              ? "bg-background-light text-foreground-light"
              : "bg-background-dark text-foreground-dark"
          }`}
        >
          {loadingMessage} <GradientCircularProgress />
        </main>
      ) : (
        <main>
          <ControlPanel premiumComponents={premiumComponents} />
          <Fretboard />
          <SettingsViewWrapper premiumComponents={premiumComponents} />
          <ChordsView />
          <AspectRatioControl />
          <AuthPanel />
          <StrummingSettings />
          <MenuOutsideClickHandler />
          {premiumComponents.get("looper") as ReactNode}
        </main>
      )}
    </>
  );
};
