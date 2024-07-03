import { WithChildren } from "@/app/helpers/withChildren";
import { Typography } from "@mui/material";
import { FC } from "react";

interface ControlWithLabelProps extends WithChildren {
  label: string;
  subtitle?: string;
}

export const ControlWithLabel: FC<ControlWithLabelProps> = ({
  children,
  label,
  subtitle,
}) => {
  return (
    <>
      <Typography className="flex items-center select-text">
        {label}:
      </Typography>
      {subtitle !== undefined && (
        <Typography variant="subtitle1" className="select-text">
          {subtitle}:
        </Typography>
      )}
      {children}
    </>
  );
};
