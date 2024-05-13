import { selectAuth, setIsSignedIn } from "@/app/store/authSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertType } from "../data/alertType";

// This hook reloads the page if the session status mismatches with the state
export const useSessionAuth = () => {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { isSignedIn } = useSelector(selectAuth);

  useEffect(() => {
    const signInCheckCountRaw = localStorage.getItem("signInCheckCount");
    const signInCheckCount =
      signInCheckCountRaw !== null ? parseInt(signInCheckCountRaw) : 0;
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
};
