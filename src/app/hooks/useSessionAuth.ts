import { useAuthSelector } from "@/app/hooks/storeHooks";
import { setIsSignedIn } from "@/app/store/authSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AlertType } from "../data/alertType";
import { processWithReloads } from "../helpers/reloadHelper";
import { removeParamsFromQuery } from "../helpers/urlHelper";

const SESSION_RELOAD_KEY = "SESSION_RELOAD_COUNT";

// This hook reloads the page if the session status mismatches with the state
export const useSessionAuth = () => {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const isSignedIn = useAuthSelector((s) => s.isSignedIn);

  useEffect(() => {
    const checkError = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get("auth-error");

      if (errorParam !== null && errorParam) {
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

    const checkSession = async () => {
      await processWithReloads(
        dispatch,
        SESSION_RELOAD_KEY,
        () => ((isSignedIn && !session) || (session && !isSignedIn)) ?? false,
        () =>
          Promise.resolve({
            shouldReload: true,
            message:
              isSignedIn && !session
                ? "Signed in, but no session is present"
                : session && !isSignedIn
                ? "Session is present but not signed in"
                : undefined,
          }),
        () => {
          dispatch(setIsSignedIn(!isSignedIn)); // apparently the status in store doesn't match the real sign in status - eliminate the mismatch
          checkError();
        },
        () => {
          checkError();
        }
      );
    };

    void checkSession();
    //Dependencies should be empty to avoid endless reload - checking the session after redirect callback from Patreon - it doesn't refresh automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
