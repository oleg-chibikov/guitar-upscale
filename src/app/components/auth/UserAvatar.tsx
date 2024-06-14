import { WithClassName } from "@/app/helpers/withClassName";
import { Avatar } from "@mui/material";
import { DefaultSession } from "next-auth";
import { CSSProperties, FC } from "react";

interface UserAvatarProps extends WithClassName {
  user: DefaultSession["user"];
  style?: CSSProperties | undefined;
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
      className={className}
      style={style} // override MUI attributes such as position (which is relative) - can't do with tailwind
      alt={user.name}
      src={user.image}
    />
  );
};
