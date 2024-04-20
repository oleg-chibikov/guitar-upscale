"use client";
import { usePremiumFeatures } from "@/app/context/PremiumFeaturesContext";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import {
  Theme,
  selectControlPanel,
  setIsSignedIn,
} from "@/app/store/controlPanelSlice";
import { Avatar, Button, Modal } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// https://docs.patreon.com/#oauth
// https://dev.to/mlhassett/working-with-the-patreon-api-now-that-we-know-what-s-going-on-4pco
export const AuthPanel: React.FC = () => {
  const premiumFeatures = usePremiumFeatures();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { chordsDisplayMode, isSignedIn, theme } =
    useSelector(selectControlPanel);
  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSignIn = async () => {
    localStorage.removeItem("signInCheckCount");
    dispatch(setIsSignedIn(true));
    await signIn("patreon");
  };

  const handleSignOut = async () => {
    localStorage.removeItem("signInCheckCount");
    dispatch(setIsSignedIn(false));
    await signOut();
  };

  useEffect(() => {
    const signInCheckoutRaw = localStorage.getItem("signInCheckCount");
    const signInCheckCount =
      signInCheckoutRaw !== null ? parseInt(signInCheckoutRaw) : 0;
    console.log("Session status", session, isSignedIn, signInCheckCount);
    if ((isSignedIn && !session) || (session && !isSignedIn)) {
      if (!signInCheckCount || signInCheckCount < 3) {
        // check to avoid endless reloads
        localStorage.setItem(
          "signInCheckCount",
          (signInCheckCount + 1).toString()
        );
        location.reload();
      }
    } else {
      localStorage.removeItem("signInCheckCount");
      dispatch(setIsSignedIn(!isSignedIn)); // apparently the status in store doesn't match the real sign in status - eliminate the mismatch
    }
    //Dependencies should be empty to avoid endless reload - checking the session after redirect callback from Patreon - it doesn't refresh automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let featuresText = "";
  const premiumFeatureNames = [
    premiumFeatures.advancedChords && "Advanced chords",
    premiumFeatures.melodies && "Melody examples",
    premiumFeatures.midiRecorder && "MIDI recording",
    premiumFeatures.skinSelection && "Configurable skins",
  ].filter((x) => x) as string[];

  return (
    <div
      className={`fixed h-10 flex flex-col justify-center ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      } z-20 top-1`}
    >
      {!session?.user?.image || !session?.user?.name ? (
        <Button
          size="small"
          onClick={handleSignIn}
          variant="contained"
          color="primary"
        >
          Sign in - Patreon
        </Button>
      ) : (
        <>
          <Button
            size="small"
            className={`flex  ${
              chordsDisplayMode === ChordsDisplayMode.Left
                ? "flex-row-reverse"
                : "flex-row"
            } gap-2`}
            title={session.user.name + ": " + session.user.email}
            onClick={handleOpenModal} // Open modal on avatar click
          >
            {premiumFeatures.subscriptionTier ?? "Go premium"}
            <Avatar alt={session.user.name} src={session.user.image} />
          </Button>
          {/* Modal component */}
          <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="subscription-modal"
          >
            <section
              className={`flex flex-col gap-1 border-2 ${
                theme === Theme.Light
                  ? "bg-accented_background-light border-border-light"
                  : "bg-accented_background-dark  border-border-dark"
              }`}
            >
              <div className="relative flex flex-row gap-4 items-center justify-center">
                <Avatar
                  className="left-2 top-2"
                  style={{ position: "absolute" }} // override MUI postion which is relative - can't do with tailwind
                  alt={session.user.name}
                  src={session.user.image}
                />
                <div className="ml-16 mr-16 flex flex-col gap-2 items-center justify-center">
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <strong>{session.user.name}</strong>
                    <span>{session.user.email}</span>
                  </div>
                  {premiumFeatures.subscriptionTier && (
                    <>
                      <strong>
                        {`Subscription level: ${premiumFeatures.subscriptionTier}`}
                      </strong>
                      <strong>Available premium features</strong>
                      {
                        <ul>
                          {premiumFeatureNames.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      }
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 flex w-full flex-col gap-2 items-stretch justify-center">
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
                  View Subscription
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            </section>
          </Modal>
        </>
      )}
    </div>
  );
};

export default AuthPanel;
