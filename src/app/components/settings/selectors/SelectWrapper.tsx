import { Theme } from "@/app/data/theme";
import { WithClassName } from "@/app/helpers/withClassName";
import { selectUi } from "@/app/store/uiSlice";
import { MenuItem, Select } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";

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
  const { theme } = useSelector(selectUi);

  return (
    <Select
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
