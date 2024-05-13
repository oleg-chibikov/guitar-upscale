import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import { Avatar, Modal, Slide } from "@mui/material";
import { useSession } from "next-auth/react";
import React, { FC } from "react";
import { useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";
import { PatreonModalAuthButton } from "./PatreonModalAuthButton";

const GooglePlaySubscribeSection = React.lazy(() =>
  import("./GooglePlaySubscribeSection").then((module) => ({
    default: module.GooglePlaySubscribeSection,
  }))
);

const featureNames: { [key: string]: string } = {
  advancedChords: "Advanced chords",
  melodies: "Melody examples",
  midiRecorder: "MIDI recording",
  skinSelection: "Configurable skins",
  chordDetection: "Chord detection",
  instruments: "Configurable instruments",
};

interface SubscriptionStatusModalProps {
  openModal: boolean;
  handleCloseModal: () => void;
}

export const SubscriptionStatusModal: FC<SubscriptionStatusModalProps> = ({
  openModal,
  handleCloseModal,
}) => {
  const premiumFeatures = usePremiumFeatures() as { [key: string]: string };
  const { data: session } = useSession();
  const { theme } = useSelector(selectUi);
  const hasDigitalGoodsService = useDigitalGoodsService();
  const premiumFeatureNames: string[] = [];
  const disabledFeatureNames: string[] = [];

  Object.entries(featureNames).forEach(([key, featureName]) => {
    const premiumFeature = premiumFeatures[key];
    if (premiumFeature) {
      premiumFeatureNames.push(featureName);
    } else {
      disabledFeatureNames.push(featureName);
    }
  });

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
                  <strong>
                    {premiumFeatures.subscriptionTier ?? "Not subscribed"}
                  </strong>
                </span>
                <strong>Premium features:</strong>
                {
                  <ul className="flex flex-col items-start">
                    {premiumFeatureNames.map((x) => (
                      <li key={x}>
                        <span className="text-green-500">✓</span> {x}
                      </li>
                    ))}
                    {disabledFeatureNames.map((x) => (
                      <li key={x}>
                        <span className="text-red-500">⨯</span> {x}
                      </li>
                    ))}
                  </ul>
                }
              </>
            </div>
          </div>
          <div className="mt-2 flex w-full flex-col gap-1 items-stretch justify-center">
            {/* This button is visible only on Android. The user can subscribe or change subscription there */}
            {hasDigitalGoodsService && <GooglePlaySubscribeSection />}
            {/* There should be a way for users to sign in to Patreon if they are
            already subscribed (they can do it on the Website) */}
            <PatreonModalAuthButton closeModal={handleCloseModal} />
          </div>
        </section>
      </Slide>
    </Modal>
  );
};
