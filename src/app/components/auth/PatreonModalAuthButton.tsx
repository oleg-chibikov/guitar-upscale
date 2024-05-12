import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { setIsSignedIn } from "@/app/store/authSlice";
import { Button } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import React, { FC, Fragment } from "react";
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
  const digitalGoodsService = useDigitalGoodsService();

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
      {isSignedIn && !digitalGoodsService && (
        <PatreonSubscribeButton closeModal={closeModal} />
      )}
      {/* This button should be visible always */}
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={handleAuth}
      >
        {!isSignedIn ? "Sign In with Patreon" : "Sign Out"}
      </Button>
    </Fragment>
  );
};
