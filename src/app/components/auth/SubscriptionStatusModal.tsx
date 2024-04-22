import { usePremiumFeatures } from "@/app/context/PremiumFeaturesProvider";
import {
  Theme,
  selectControlPanel,
  setIsSignedIn,
} from "@/app/store/controlPanelSlice";
import { Avatar, Button, Modal, Slide } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";

interface SubscriptionStatusModalProps {
  openModal: boolean;
  handleCloseModal: () => void;
}

export const SubscriptionStatusModal: FC<SubscriptionStatusModalProps> = ({
  openModal,
  handleCloseModal,
}) => {
  const premiumFeatures = usePremiumFeatures();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { theme } = useSelector(selectControlPanel);

  const isSignedIn = session?.user?.image && session?.user?.name;

  const handleAuth = async () => {
    localStorage.removeItem("signInCheckCount");
    dispatch(setIsSignedIn(!isSignedIn));
    if (isSignedIn) {
      await signOut();
    } else {
      await signIn("patreon");
    }
  };

  const premiumFeatureNames = [
    premiumFeatures.advancedChords && "Advanced chords",
    premiumFeatures.melodies && "Melody examples",
    premiumFeatures.midiRecorder && "MIDI recording",
    premiumFeatures.skinSelection && "Configurable skins",
  ].filter((x) => x) as string[];

  const disabledFeatureNames = [
    !premiumFeatures.advancedChords && "Advanced chords",
    !premiumFeatures.melodies && "Melody examples",
    !premiumFeatures.midiRecorder && "MIDI recording",
    !premiumFeatures.skinSelection && "Configurable skins",
  ].filter((x) => x) as string[];

  return (
    <Modal
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="subscription-modal"
    >
      <Slide direction="down" in={openModal} mountOnEnter unmountOnExit>
        <section
          className={`flex flex-col gap-1 border-2 p-1 ${
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
            {isSignedIn && (
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => {
                  window.open(
                    "https://patreon.com/guitar_upscale?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink",
                    "_blank"
                  );
                  handleCloseModal(); // Close modal after opening link
                }}
              >
                Change membership plan
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={handleAuth}
            >
              {!isSignedIn ? "Sign In with Patreon" : "Sign Out"}
            </Button>
          </div>
        </section>
      </Slide>
    </Modal>
  );
};
