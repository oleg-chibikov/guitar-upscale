"use client";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import {
  Theme,
  selectControlPanel,
  setIsSignedIn,
} from "@/app/store/controlPanelSlice";
import { Avatar, Button } from "@mui/material";
import { signIn, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const SubscriptionStatusModal = dynamic(
  async () =>
    (await import("./SubscriptionStatusModal")).SubscriptionStatusModal
);

// https://docs.patreon.com/#oauth
// https://dev.to/mlhassett/working-with-the-patreon-api-now-that-we-know-what-s-going-on-4pco
export const AuthPanel: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [height, setHeight] = useState<number>(window.innerHeight);
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { chordsDisplayMode, isSignedIn, subscriptionTier, theme } =
    useSelector(selectControlPanel);
  const handleCloseModal = () => {
    setOpenModal(false);
  };
  const handleOpenModal = () => {
    setOpenModal(true);
    setModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  const handleSignIn = async () => {
    localStorage.removeItem("signInCheckCount");
    dispatch(setIsSignedIn(true));
    await signIn("patreon");
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

  return (
    <div
      className={`fixed flex flex-col justify-center ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      }
      ${`maxhmd:hmd:p-1 maxhmd:border-2 ${
        theme === Theme.Light
          ? "maxhmd:bg-accented_background-light maxhmd:border-border-light maxhmd:text-foreground-light"
          : "maxhmd:bg-accented_background-dark  maxhmd:border-border-dark maxhmd:text-foreground-dark"
      }`}
       z-20 top-1`}
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
            className={`flex ${
              chordsDisplayMode === ChordsDisplayMode.Left
                ? "flex-row-reverse"
                : "flex-row"
            } gap-2`}
            style={{ minWidth: 0 }} // override MUI value
            title={session.user.name + ": " + session.user.email}
            onClick={handleOpenModal} // Open modal on avatar click
          >
            <span className="hidden md:block">
              {subscriptionTier ?? "Go premium"}
            </span>
            <Avatar alt={session.user.name} src={session.user.image} />
          </Button>

          {modalOpened && (
            <SubscriptionStatusModal
              openModal={openModal}
              handleCloseModal={handleCloseModal}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AuthPanel;
