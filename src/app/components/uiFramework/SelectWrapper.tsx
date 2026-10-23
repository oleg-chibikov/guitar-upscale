import { Theme } from "@/app/data/theme";
import { WithClassName } from "@/app/helpers/withClassName";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { MenuItem, Select, Tooltip } from "@mui/material";
import React from "react";

interface SelectWrapperProps extends WithClassName {
  // a colour shows as a dot before the label
  options: { value: string | number; label: string; color?: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  tooltip?: string;
}

export const SelectWrapper: React.FC<SelectWrapperProps> = ({
  options,
  value,
  onChange,
  className,
  disabled = false,
  tooltip,
}) => {
  const theme = useUiSelector((s) => s.theme);

  const selectComponent = (
    <Select
      disabled={disabled}
      SelectDisplayProps={{ style: { paddingRight: "20px" } }}
      value={value}
      onChange={(event) =>
        onChange !== undefined &&
        onChange(event.target.value as string | number)
      }
      // inputProps={{ // uncomment to style the items
      //   MenuProps: {
      //     MenuListProps: {
      //       sx: {
      //         backgroundColor: "red",
      //       },
      //     },
      //   },
      // }}
      className={`h-7 ${className} p-0 ${
        disabled
          ? theme === Theme.Light
            ? "bg-disabled-light text-gray-500"
            : "bg-disabled-dark text-gray-500"
          : theme === Theme.Light
          ? "bg-select_background-light text-select_foreground-light"
          : "bg-select_background-dark text-select_foreground-dark"
      }`}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.color !== undefined && (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0"
              style={{ background: option.color }}
            />
          )}
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );

  return tooltip !== undefined ? (
    <Tooltip title={tooltip}>{selectComponent}</Tooltip>
  ) : (
    selectComponent
  );
};
