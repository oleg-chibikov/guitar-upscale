import { WithChildren } from "@/app/helpers/withChildren";
import { Typography } from "@mui/material";
import { FC } from "react";

interface ControlWithLabelProps extends WithChildren {
  label: string;
}

export const ControlWithLabel: FC<ControlWithLabelProps> = ({
  children,
  label,
}) => {
  return (
    <>
      <Typography className="flex items-center select-text" variant="body2">
        {label}:
      </Typography>
      {children}
    </>
  );
};
