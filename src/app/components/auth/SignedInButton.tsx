import { UserAvatar } from "@/app/components/auth/UserAvatar";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { selectAuth } from "@/app/store/authSlice";
import { selectUi } from "@/app/store/uiSlice";
import { Button } from "@mui/material";
import { Session } from "next-auth";
import { FC } from "react";
import { useSelector } from "react-redux";
import { AuthButtonProps } from "./AuthButtonProps";

export const SignedInButton: FC<
  AuthButtonProps & { user?: Session["user"] }
> = ({ openModal, user }) => {
  const { subscriptionTier } = useSelector(selectAuth);
  const { chordsDisplayMode, theme } = useSelector(selectUi);
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
      onClick={openModal} // Open modal on avatar click
    >
      <span
        className={`hidden px-2 sm:block ${
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }`}
      >
        {subscriptionTier?.tier ?? "Go premium"}
      </span>

      <UserAvatar user={user} />
    </Button>
  );
};
