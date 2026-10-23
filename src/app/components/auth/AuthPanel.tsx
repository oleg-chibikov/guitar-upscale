import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { AUTH_PANEL_ID } from "@/app/data/elementIds";
import { Theme } from "@/app/data/theme";
import { useAuthSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { OpenAuthDialogButton } from "./OpenAuthDialogButton";
import { SignedInButton } from "./SignedInButton";

const PurchaseOptionsDialog = dynamic(
  async () => (await import("./PurchaseOptionsDialog")).PurchaseOptionsDialog,
);

// https://docs.patreon.com/#oauth
// https://dev.to/mlhassett/working-with-the-patreon-api-now-that-we-know-what-s-going-on-4pco
export const AuthPanel: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogOpened, setDialogOpened] = useState(false);
  const { data: session } = useSession();
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const theme = useUiSelector((s) => s.theme);
  const subscriptionTier = useAuthSelector((s) => s.subscriptionTier);

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
      } ${`maxhmd:hmd:p-1 maxhmd:border-2 ${
        theme === Theme.Light
          ? "maxhmd:border-border-light maxhmd:bg-accented_background-light maxhmd:text-foreground-light"
          : "maxhmd:border-border-dark maxhmd:bg-accented_background-dark maxhmd:text-foreground-dark"
      }`} top-1 z-20`}
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
