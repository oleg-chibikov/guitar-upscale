import { Theme } from "@/app/data/theme";
import { WithClassName } from "@/app/helpers/withClassName";
import { MenuItem, Select } from "@mui/material";
import React from "react";

interface SelectWrapperProps extends WithClassName {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
}

export const SelectWrapper: React.FC<SelectWrapperProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  const theme = useUiSelector((s) => s.theme);

  return (
    <Select
      SelectDisplayProps={{ style: { paddingRight: "20px" } }}
      value={value}
      onChange={(event) =>
        onChange !== undefined &&
        onChange(event.target.value as string | number)
      }
      className={`h-7 ${className} p-0`}
    >
      {options.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          className={
            theme === Theme.Light
              ? "text-select_foreground-light"
              : "text-select_foreground-dark"
          }
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};
