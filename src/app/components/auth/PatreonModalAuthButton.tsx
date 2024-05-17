import { useDigitalGoodsServiceInfo } from "@/app/context/DigitalGoodsServiceInfoProvider";
import { CheckBox } from "@/app/settings/checkboxes/CheckBox";
import { setIsSignedIn } from "@/app/store/authSlice";
import { Button } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import React, { FC, Fragment, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ModalAuthButtonProps } from "./AuthButtonProps";

const PatreonSubscribeButton = React.lazy(() =>
  import("./PatreonSubscribeButton").then((module) => ({
    default: module.PatreonSubscribeButton,
  }))
);

export const PatreonModalAuthButton: FC<ModalAuthButtonProps> = ({
  closeModal,
}) => {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const isSignedIn = session?.user?.image && session?.user?.name;
  const hasDigitalGoodsService = useDigitalGoodsServiceInfo();
  const [userWantsToSignInWithPatreon, setUserWantsToSignInWithPatreon] =
    useState<boolean>(!hasDigitalGoodsService);
  useEffect(() => {
    setUserWantsToSignInWithPatreon(!hasDigitalGoodsService); // set to true when the service is not active
  }, [hasDigitalGoodsService]);

  const handleAuth = async () => {
    localStorage.removeItem("signInCheckCount");
    dispatch(setIsSignedIn(!isSignedIn));
    if (isSignedIn) {
      await signOut();
    } else {
      await signIn("patreon");
    }
  };

  return (
    // This button should not be visible on Android due to Google play billing policy (only Google play Billing is allowed)
    <Fragment>
      {isSignedIn && !hasDigitalGoodsService && (
        <PatreonSubscribeButton closeModal={closeModal} />
      )}
      {!isSignedIn && !userWantsToSignInWithPatreon && (
        <CheckBox
          label="I have already subscribed on the website, let me use my subscription"
          value={userWantsToSignInWithPatreon}
          onValueChange={setUserWantsToSignInWithPatreon}
        />
      )}
      {(isSignedIn || userWantsToSignInWithPatreon) && (
        /* This button should be visible always */
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={handleAuth}
        >
          {!isSignedIn ? "Sign In with Patreon" : "Sign Out"}
        </Button>
      )}
    </Fragment>
  );
};
