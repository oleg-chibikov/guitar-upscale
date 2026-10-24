"use client";

import { BottomZone } from "@/app/components/BottomZone";
import { ScaleDetectionDialogWrapper } from "@/app/components/alert/ScaleDetectionDialogWrapper";
import { AspectRatioModalWrapper } from "@/app/components/aspectRatio/AspectRatioModalWrapper";
import { PianoRollDialogWrapper } from "@/app/components/pianoRoll/PianoRollDialogWrapper";
import { NowPlaying } from "@/app/components/playPanel/NowPlaying";
import { StrummingPatternDialogWrapper } from "@/app/components/strumming/StrummingPatternDialogWrapper";
import { StrummingSettingsWrapper } from "@/app/components/strumming/StrummingSettingsWrapper";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { isAuthEnabled } from "@/lib/featureFlags";
import { ReactNode, useRef } from "react";
import { Theme } from "../data/theme";
import { WithPremiumComponents } from "../helpers/withPremiumFeatures";
import { GradientCircularProgress } from "./GradientCircularProgress";
import { Initializer } from "./Initializer";
import { AlertWrapper } from "./alert/AlertWrapper";
import AuthPanel from "./auth/AuthPanel";
import { ChordsView } from "./chords/ChordsView";
import { Fretboard } from "./fret/Fretboard";
import { ControlPanel } from "./settings/ControlPanel";
import { SettingsViewWrapper } from "./settings/SettingsViewWrapper";

export const ClientRoot: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const loadingMessage = useUiSelector((s) => s.loadingMessage);
  const theme = useUiSelector((s) => s.theme);
  const mainRef = useRef<HTMLElement>(null);

  return (
    <>
      <Initializer />
      {premiumComponents.get("advancedChords") as ReactNode}
      <AlertWrapper />
      <ScaleDetectionDialogWrapper />
      {loadingMessage !== undefined ? (
        <main
          className={`flex flex-col items-center justify-center gap-2 text-center align-middle text-2xl ${
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
          {isAuthEnabled && <AuthPanel />}
          <StrummingSettingsWrapper />
          <StrummingPatternDialogWrapper />
          <BottomZone
            premiumComponents={premiumComponents}
            chords={<ChordsView mainRef={mainRef} />}
          />
          <NowPlaying />
          <AspectRatioModalWrapper />
          <PianoRollDialogWrapper />
        </main>
      )}
    </>
  );
};
