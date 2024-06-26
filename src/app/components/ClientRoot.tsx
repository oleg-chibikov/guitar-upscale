"use client";

import { BottomZone } from "@/app/components/BottomZone";
import { ScaleDetectionAlertWrapper } from "@/app/components/alert/ScaleDetectionAlertWrapper";
import { AspectRatioModalWrapper } from "@/app/components/aspectRatio/AspectRatioModalWrapper";
import { StrummingSettingsWrapper } from "@/app/components/settings/StrummingSettingsWrapper";
import { useRef } from "react";
import { useSelector } from "react-redux";
import { Theme } from "../data/theme";
import { WithPremiumComponents } from "../helpers/withPremiumFeatures";
import { selectUi } from "../store/uiSlice";
import { GradientCircularProgress } from "./GradientCircularProgress";
import { Initializer } from "./Initializer";
import { MenuOutsideClickHandler } from "./MenuOutsideClickHandler";
import { AlertWrapper } from "./alert/AlertWrapper";
import AuthPanel from "./auth/AuthPanel";
import { ChordsView } from "./chords/ChordsView";
import { Fretboard } from "./fret/Fretboard";
import { ControlPanel } from "./settings/ControlPanel";
import { SettingsViewWrapper } from "./settings/SettingsViewWrapper";

export const ClientRoot: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { loadingMessage, theme } = useSelector(selectUi);
  const mainRef = useRef<HTMLElement>(null);

  return (
    <>
      <Initializer />
      <AlertWrapper />
      <ScaleDetectionAlertWrapper />
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
        <main ref={mainRef} className="overflow-auto">
          <ControlPanel premiumComponents={premiumComponents} />
          <Fretboard />
          <SettingsViewWrapper premiumComponents={premiumComponents} />
          <ChordsView mainRef={mainRef} />
          <AuthPanel />
          <StrummingSettingsWrapper />
          <MenuOutsideClickHandler />
          <BottomZone premiumComponents={premiumComponents} />
          <AspectRatioModalWrapper />
        </main>
      )}
    </>
  );
};
