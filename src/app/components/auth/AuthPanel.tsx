"use client";
import { usePremiumFeatures } from "@/app/context/PremiumFeaturesContext";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import {
  selectControlPanel,
  setIsSignedIn,
  setSignedInCheckCount,
} from "@/app/store/controlPanelSlice";
import { Avatar, Button } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// https://docs.patreon.com/#oauth
// TODO: https://dev.to/mlhassett/working-with-the-patreon-api-now-that-we-know-what-s-going-on-4pco
// TODO: displays as logged out after
export const AuthPanel: React.FC = () => {
  const premiumFeatures = usePremiumFeatures();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { chordsDisplayMode, isSignedIn, signInCheckCount } =
    useSelector(selectControlPanel);

  const handleSignIn = async () => {
    dispatch(setSignedInCheckCount(0));
    dispatch(setIsSignedIn(true));
    await signIn("patreon");
  };

  const handleSignOut = async () => {
    dispatch(setSignedInCheckCount(0));
    dispatch(setIsSignedIn(false));
    await signOut();
  };

  useEffect(() => {
    console.log("Session status", session, isSignedIn, signInCheckCount);
    if ((isSignedIn && !session) || (session && !isSignedIn)) {
      if (signInCheckCount < 3) {
        // check to avoid endless reloads
        dispatch(setSignedInCheckCount(signInCheckCount + 1));
        location.reload();
      }
    } else {
      dispatch(setSignedInCheckCount(0));
      dispatch(setIsSignedIn(!isSignedIn)); // apparently the status in store doesn't match the real sign in status - aeliminate the mismatch
    }
    //Dependencies should be empty to avoid endless reload - checking the session after redirect callback from Patreon - it doesn't refresh automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed h-10 flex flex-col justify-center ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      } z-20 top-1`}
    >
      {!session?.user?.image || !session?.user?.name ? (
        <Button
          size={"small"}
          onClick={handleSignIn}
          variant="contained"
          color="primary"
        >
          Sign in with Patreon
        </Button>
      ) : (
        <div
          className={`flex items-center justify-center ${
            chordsDisplayMode === ChordsDisplayMode.Left
              ? "flex-row-reverse"
              : "flex-row"
          } gap-2`}
        >
          <Button onClick={handleSignOut} variant="contained" color="secondary">
            Sign out
          </Button>
          <Button
            size="small"
            className={`flex  ${
              chordsDisplayMode === ChordsDisplayMode.Left
                ? "flex-row-reverse"
                : "flex-row"
            } gap-2`}
            title={session.user.name + ": " + session.user.email}
            onClick={() => {
              // preview https://www.patreon.com/user?u=126121181&fan_landing=true&view_as=public
              window.open(
                "https://patreon.com/guitar_upscale?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink",
                "_blank"
              );
            }}
          >
            {premiumFeatures?.subscriptionTier ?? "Go premium"}
            <Avatar alt={session.user.name} src={session.user.image} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuthPanel;
