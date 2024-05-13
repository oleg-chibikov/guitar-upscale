import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import { Theme } from "@/app/data/theme";
import { selectAuth } from "@/app/store/authSlice";
import { selectUi } from "@/app/store/uiSlice";
import { PremiumFeatureKeys } from "@/lib/subscription";
import { Tier } from "@/lib/tiers";
import { Avatar, Modal, Slide } from "@mui/material";
import { useSession } from "next-auth/react";
import React, { FC, useState } from "react";
import { useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";
import { PatreonModalAuthButton } from "./PatreonModalAuthButton";

const GooglePlaySubscribeSection = React.lazy(() =>
  import("./GooglePlaySubscribeSection").then((module) => ({
    default: module.GooglePlaySubscribeSection,
  }))
);

const featureNames = {
  advancedChords: "Advanced chords",
  melodies: "Melody examples",
  chordDetection: "Chord detection",
  instruments: "Configurable instruments",
  midiRecorder: "MIDI recording",
  skinSelection: "Configurable skins",
};

interface SubscriptionStatusModalProps {
  openModal: boolean;
  handleCloseModal: () => void;
}

export const SubscriptionStatusModal: FC<SubscriptionStatusModalProps> = ({
  openModal,
  handleCloseModal,
}) => {
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
  const hasDigitalGoodsService = useDigitalGoodsService();
  const [highlightedOption, setHighlightedOption] = useState<Tier>();

  const renderPossibleFeature = (x: PremiumFeatureKeys) => {
    if (
      (highlightedOption === "Composer" && keyValueComposerFeatures[x]) ||
      (highlightedOption === "Explorer" && keyValueExplorerFeatures[x])
    ) {
      return <span className="text-green-500 opacity-50">✓</span>;
    }
    return null;
  };

  const renderCurrentFeature = (x: PremiumFeatureKeys) => (
    <span
      className={keyValueCurrentFeatures[x] ? "text-green-500" : "text-red-500"}
    >
      {keyValueCurrentFeatures[x] ? "✓" : "⨯"}
    </span>
  );

  return (
    <Modal
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="subscription-modal"
    >
      <Slide direction="down" in={openModal} mountOnEnter unmountOnExit>
        <section
          className={`flex overflow-auto max-h-full flex-col gap-1 border-2 p-1 ${
            theme === Theme.Light
              ? "bg-accented_background-light border-border-light text-foreground-light"
              : "bg-accented_background-dark  border-border-dark text-foreground-dark"
          }`}
        >
          <div className="relative flex flex-row gap-4 items-center justify-center">
            {session?.user?.name && session.user.image && (
              <Avatar
                className="left-2 top-2"
                style={{ position: "absolute" }} // override MUI postion which is relative - can't do with tailwind
                alt={session.user.name}
                src={session.user.image}
              />
            )}
            <CloseIcon onPress={handleCloseModal} />
            <div className="ml-16 mr-16 flex flex-col gap-1 items-center justify-center">
              {session?.user && (
                <div className="flex flex-col gap-1 items-center justify-center">
                  <strong>{session.user.name}</strong>
                  <span>{session.user.email}</span>
                </div>
              )}

              <>
                <span>
                  {"Subscription level:"}{" "}
                  <strong>{subscriptionTier ?? "Not subscribed"}</strong>
                </span>
                {
                  <ul className="flex flex-col items-start">
                    {Object.entries(featureNames).map(([key, value]) => (
                      <li key={key} className="flex flex-row gap-2">
                        {renderCurrentFeature(key as PremiumFeatureKeys)}
                        {value}
                        {renderPossibleFeature(key as PremiumFeatureKeys)}
                      </li>
                    ))}
                  </ul>
                }
              </>
            </div>
          </div>
          <div className="mt-2 flex w-full flex-col gap-1 items-stretch justify-center">
            {/* This button is visible only on Android. The user can subscribe or change subscription there */}
            {hasDigitalGoodsService && (
              <GooglePlaySubscribeSection
                onOptionSelected={(tier) => {
                  setHighlightedOption(tier);
                }}
              />
            )}
            {/* There should be a way for users to sign in to Patreon if they are
            already subscribed (they can do it on the Website) */}
            <PatreonModalAuthButton closeModal={handleCloseModal} />
          </div>
        </section>
      </Slide>
    </Modal>
  );
};
