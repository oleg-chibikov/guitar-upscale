import { UserAvatar } from "@/app/components/auth/UserAvatar";
import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { selectAuth } from "@/app/store/authSlice";
import { selectUi } from "@/app/store/uiSlice";
import { PremiumFeatureKeys } from "@/lib/premiumFeatures";
import { SubscriptionProvider } from "@/lib/subscriptionProvider";
import { Tier } from "@/lib/tier";
import { Alert, Drawer, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import React, { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ModalProps } from "../ModalProps";
import { PatreonModalAuthButton } from "./PatreonModalAuthButton";

const GooglePlayPurchaseSection = React.lazy(() =>
  import("./GooglePlayPurchaseSection").then((module) => ({
    default: module.GooglePlayPurchaseSection,
  }))
);

type AllowedKeys = Exclude<
  PremiumFeatureKeys,
  | "reverbStrength"
  | "playbackTypeSelection"
  | "toggleMetronomeWhenRecordingCheckbox"
>;

const featureNames: Record<AllowedKeys, string> = {
  advancedChords: "Advanced chords",
  melodies: "Melody examples",
  chordDetection: "Chord detection",
  scaleDetection: "Scale detection",
  midiUpload: "Play MIDI files",
  instruments: "Configurable instruments",
  midiRecorder: "MIDI recording",
  looper: "Looper",
  skinSelection: "Configurable skins",
};

export const PurchaseOptionsModal: FC<ModalProps> = ({
  isOpen,
  handleCloseModal,
}) => {
  const [open, setOpen] = useState<boolean>(false); // this is needed to use animation when loaded first time

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const { premiumFeatures, composerPremiumFeatures, explorerPremiumFeatures } =
    usePremiumFeatures();
  const keyValueCurrentFeatures = premiumFeatures as { [key: string]: string };
  const keyValueComposerFeatures = composerPremiumFeatures as {
    [key: string]: string;
  };
  const keyValueExplorerFeatures = explorerPremiumFeatures as {
    [key: string]: string;
  };
  const { data: session } = useSession();
  const { theme } = useSelector(selectUi);
  const { subscriptionTier } = useSelector(selectAuth);
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const [highlightedOption, setHighlightedOption] = useState<Tier>();
  const isOnline = useOnlineStatus();

  const renderCurrentFeature = (x: PremiumFeatureKeys) => {
    const isCurrentlyEnabled = keyValueCurrentFeatures[x] ? true : false;

    let isTick: boolean;
    const className =
      "border-dashed rounded-full w-6 h-6 flex items-center justify-center";
    let additionalClassName: string;
    if (highlightedOption) {
      // Show what it would look like if the selected option is applied
      const highlightedOptionHasFeature =
        (highlightedOption === "Composer" && keyValueComposerFeatures[x]
          ? true
          : false) ||
        (highlightedOption === "Explorer" && keyValueExplorerFeatures[x]
          ? true
          : false) ||
        false;

      if (isCurrentlyEnabled) {
        if (highlightedOptionHasFeature) {
          isTick = true;
          additionalClassName = "text-green-500";
        } else {
          isTick = false;
          additionalClassName =
            "text-red-500 opacity-50 border-2 border-red-500";
        }
      } else {
        if (highlightedOptionHasFeature) {
          isTick = true;
          additionalClassName =
            "text-green-500 opacity-50 border-2 border-green-500";
        } else {
          isTick = false;
          additionalClassName = "text-red-500";
        }
      }
    } else {
      isTick = isCurrentlyEnabled;
      additionalClassName = isCurrentlyEnabled
        ? "text-green-500"
        : "text-red-500";
    }

    return (
      <div className={`${className} ${additionalClassName}`}>
        {isTick ? "✓" : "⨯"}
      </div>
    );
  };

  return (
    <Drawer
      anchor="top"
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="purchase-options-modal"
    >
      <DialogContentWrapper onClose={handleCloseModal}>
        <div className="flex flex-row gap-4 items-center justify-center">
          {session !== null ? (
            <UserAvatar
              user={session.user}
              className="left-4 top-4"
              style={{ position: "absolute" }}
            />
          ) : null}
          <div className="ml-16 mr-16 flex flex-col gap-1 items-center justify-center">
            {session?.user && (
              <div className="flex flex-col gap-1 items-center justify-center">
                <strong>{session.user.name}</strong>
                <Typography>{session.user.email}</Typography>
              </div>
            )}

            <>
              <Typography>
                {"Subscription level:"}{" "}
                <strong>{subscriptionTier?.tier ?? "Not subscribed"}</strong>
              </Typography>
              {
                <ul className="flex flex-col items-start">
                  {Object.entries(featureNames).map(([key, value]) => (
                    <li key={key} className="flex flex-row gap-2">
                      {renderCurrentFeature(key as PremiumFeatureKeys)}
                      {value}
                    </li>
                  ))}
                </ul>
              }
            </>
          </div>
        </div>
        {isOnline ? (
          <div className="mt-2 flex w-full flex-col gap-2 items-stretch justify-center">
            {/* This button is visible only on Android. The user can subscribe or change subscription there. It is not visible if already subscribed with another provider */}
            {hasDigitalGoodsService &&
              (!subscriptionTier ||
                subscriptionTier.provider ===
                  SubscriptionProvider.GooglePlay) && (
                <GooglePlayPurchaseSection
                  onOptionSelected={(tier) => {
                    setHighlightedOption(tier);
                  }}
                />
              )}
            {/* There should be a way for users to sign in to Patreon if they are
            already subscribed (they can do it on the Website) */}
            <PatreonModalAuthButton closeModal={handleCloseModal} />
          </div>
        ) : (
          <Alert severity="warning">
            {"Subscription options will be loaded when you're back online"}
          </Alert>
        )}
      </DialogContentWrapper>
    </Drawer>
  );
};
