import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { AUTH_PANEL_ID } from "@/app/data/elementIds";
import { Theme } from "@/app/data/theme";
import { selectAuth } from "@/app/store/authSlice";
import { selectUi } from "@/app/store/uiSlice";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useSelector } from "react-redux";
import { OpenAuthDialogButton } from "./OpenAuthDialogButton";
import { SignedInButton } from "./SignedInButton";

const PurchaseOptionsDialog = dynamic(
  async () => (await import("./PurchaseOptionsDialog")).PurchaseOptionsDialog
);

// https://docs.patreon.com/#oauth
// https://dev.to/mlhassett/working-with-the-patreon-api-now-that-we-know-what-s-going-on-4pco
export const AuthPanel: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogOpened, setDialogOpened] = useState(false);
  const { data: session } = useSession();
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  const { subscriptionTier } = useSelector(selectAuth);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setDialogOpened(true); // only set this once to true to enable code splitting for the dialog - it won't be loaded until this prop is true
  };

  return (
    <div
      id={AUTH_PANEL_ID}
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
      {session?.user || subscriptionTier ? (
        <SignedInButton openDialog={handleOpenDialog} user={session?.user} />
      ) : (
        <OpenAuthDialogButton openDialog={handleOpenDialog} />
      )}

      {dialogOpened && (
        <PurchaseOptionsDialog
          isOpen={openDialog}
          handleCloseDialog={handleCloseDialog}
        />
      )}
    </div>
  );
};

export default AuthPanel;
