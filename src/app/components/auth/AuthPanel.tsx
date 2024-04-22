"use client";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { selectAuth, setIsSignedIn } from "@/app/store/authSlice";
import { selectUi, setAndShowAlert } from "@/app/store/uiSlice";
import Login from "@mui/icons-material/Login";
import { Avatar, Button } from "@mui/material";
import { useSession } from "next-auth/react";
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
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { isSignedIn, subscriptionTier } = useSelector(selectAuth);
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  const handleCloseModal = () => {
    setOpenModal(false);
  };
  const handleOpenModal = () => {
    setOpenModal(true);
    setModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  useEffect(() => {
    const signInCheckoutRaw = localStorage.getItem("signInCheckCount");
    const signInCheckCount =
      signInCheckoutRaw !== null ? parseInt(signInCheckoutRaw) : 0;
    console.log("Session status", session, isSignedIn, signInCheckCount);

    const checkError = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get("auth-error");

      if (errorParam) {
        console.log("Query string container error");
        dispatch(
          setAndShowAlert({ message: "Authentication error", isError: true })
        ); // Assuming you have an action to show the alert with a message
        const newUrl = window.location.pathname; // Assuming you want to keep the same path but update the query string
        window.history.replaceState(null, "", newUrl); // Change the URL without reloading
      }
    };

    if ((isSignedIn && !session) || (session && !isSignedIn)) {
      console.log("Signin status mismatch");
      if (signInCheckCount < 2) {
        console.log("Reloading page");
        // check to avoid endless reloads
        localStorage.setItem(
          "signInCheckCount",
          (signInCheckCount + 1).toString()
        );
        location.reload();
      } else {
        console.log("Reload attempts exceeded");
        //localStorage.removeItem("signInCheckCount");
        dispatch(setIsSignedIn(!isSignedIn)); // apparently the status in store doesn't match the real sign in status - eliminate the mismatch
        checkError();
      }
    } else {
      console.log("Signin status matched");
      // sign in status in state matches session
      localStorage.removeItem("signInCheckCount");
      checkError();
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
          onClick={handleOpenModal}
          variant="contained"
          color="primary"
          title="Sign in"
          style={{ minWidth: 0, padding: 6 }} // override MUI value
          className={`flex ${
            chordsDisplayMode === ChordsDisplayMode.Left
              ? "flex-row-reverse"
              : "flex-row"
          } gap-2`}
        >
          <Login />
          <span
            className={`hidden sm:block ${
              theme === Theme.Light
                ? "text-foreground-light"
                : "text-foreground-dark"
            }`}
          >
            Sign in
          </span>
        </Button>
      ) : (
        <Button
          size="small"
          className={`flex ${
            chordsDisplayMode === ChordsDisplayMode.Left
              ? "flex-row-reverse"
              : "flex-row"
          } gap-0`}
          style={{ minWidth: 0, padding: 4 }} // override MUI value
          title={session.user.name + ": " + session.user.email}
          onClick={handleOpenModal} // Open modal on avatar click
        >
          <span
            className={`hidden px-2 sm:block ${
              theme === Theme.Light
                ? "text-foreground-light"
                : "text-foreground-dark"
            }`}
          >
            {subscriptionTier ?? "Go premium"}
          </span>
          <Avatar alt={session.user.name} src={session.user.image} />
        </Button>
      )}
      {modalOpened && (
        <SubscriptionStatusModal
          openModal={openModal}
          handleCloseModal={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AuthPanel;
