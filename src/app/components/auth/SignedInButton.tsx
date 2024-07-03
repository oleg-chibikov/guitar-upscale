import { UserAvatar } from "@/app/components/auth/UserAvatar";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { useAuthSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { Button, Typography } from "@mui/material";
import { Session } from "next-auth";
import { FC } from "react";
import { AuthButtonProps } from "./AuthButtonProps";

export const SignedInButton: FC<
  AuthButtonProps & { user?: Session["user"] }
> = ({ openDialog, user }) => {
  const subscriptionTier = useAuthSelector((s) => s.subscriptionTier);
  const theme = useUiSelector((s) => s.theme);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  return (
    <Button
      size="small"
      className={`flex ${
        chordsDisplayMode === ChordsDisplayMode.Left
          ? "flex-row-reverse"
          : "flex-row"
      } gap-0`}
      style={{ minWidth: 0, padding: 4 }} // override MUI value
      title={
        (user ? `${user.name}: ${user.email} - ` : "") + subscriptionTier?.tier
      }
      onClick={openDialog} // Open dialog on avatar click
    >
      <Typography
        variant="caption"
        className={`hidden px-2 sm:block ${
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }`}
      >
        {subscriptionTier?.tier ?? "Go premium"}
      </Typography>

      <UserAvatar user={user} />
    </Button>
  );
};
