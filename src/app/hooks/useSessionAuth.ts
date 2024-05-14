import { selectAuth, setIsSignedIn } from "@/app/store/authSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertType } from "../data/alertType";
import {
  clearReloadCount,
  getReloadCount,
  incrementAndReload,
} from "../helpers/reloadHelper";
import { removeParamsFromQuery } from "../helpers/urlHelper";

const SESSION_RELOAD_KEY = "SESSION_RELOAD_COUNT";

// This hook reloads the page if the session status mismatches with the state
export const useSessionAuth = () => {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { isSignedIn } = useSelector(selectAuth);

  useEffect(() => {
    const signInCheckCount = getReloadCount(SESSION_RELOAD_KEY);
    console.log("Session status", session, isSignedIn, signInCheckCount);

    const checkError = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get("auth-error");

      if (errorParam) {
        console.log("Query string container error");
        dispatch(
          setAndShowAlert({
            message: "Authentication error",
            alertType: AlertType.Error,
          })
        );
        removeParamsFromQuery();
      }
    };

    const isMismatch = (isSignedIn && !session) || (session && !isSignedIn);

    if (isMismatch) {
      console.log("Signin status mismatch");
      if (signInCheckCount < 2) {
        // check to avoid endless reloads
        incrementAndReload("signInCheckCount", signInCheckCount);
      } else {
        console.log("Reload attempts exceeded");
        //   clearReloadCount(RELOAD_KEY);
        dispatch(setIsSignedIn(!isSignedIn)); // apparently the status in store doesn't match the real sign in status - eliminate the mismatch
        checkError();
      }
    } else {
      console.log("Signin status matched");
      // sign in status in state matches session
      clearReloadCount(SESSION_RELOAD_KEY);
      checkError();
    }
    //Dependencies should be empty to avoid endless reload - checking the session after redirect callback from Patreon - it doesn't refresh automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
