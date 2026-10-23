import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { Checkbox, Typography } from "@mui/material";
import React from "react";

export type CheckBoxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
};

export const CheckBox: React.FC<CheckBoxProps> = ({
  label,
  value,
  onValueChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.checked);
  };

  const theme = useUiSelector((s) => s.theme);
  return (
    <div className="flex flex-row items-center gap-2">
      <Checkbox
        size="small"
        className={`mr-2 ${
          theme === Theme.Light ? "accent-primary-light" : "accent-primary-dark"
        }`}
        id={label}
        checked={value}
        onChange={handleChange}
      />
      <label
        className={
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }
        htmlFor={label}
      >
        <Typography className="select-text">{label}</Typography>
      </label>
    </div>
  );
};
