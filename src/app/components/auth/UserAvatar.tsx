import { WithClassName } from "@/app/helpers/withClassName";
import { WithStyle } from "@/app/helpers/withStyle";
import { Avatar } from "@mui/material";
import { DefaultSession } from "next-auth";
import { FC } from "react";

interface UserAvatarProps extends WithClassName, WithStyle {
  user: DefaultSession["user"];
}

export const UserAvatar: FC<UserAvatarProps> = ({ user, className, style }) => {
  if (
    user === undefined ||
    user.name === null ||
    user.name === undefined ||
    user.image === null ||
    user.image === undefined
  ) {
    return null;
  }

  return (
    <Avatar
      sx={{ width: 24, height: 24 }}
      className={className}
      style={style} // override MUI attributes such as position (which is relative) - can't do with tailwind
      alt={user.name}
      src={user.image}
    />
  );
};
