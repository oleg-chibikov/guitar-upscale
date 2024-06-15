import { Theme } from "@/app/data/theme";
import { WithClassName } from "@/app/helpers/withClassName";
import { selectUi } from "@/app/store/uiSlice";
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
    <select
      value={value}
      onChange={(event) =>
        onChange !== undefined && onChange(event.target.value)
      }
      className={`h-7 text-xs p-1 ${
        theme === Theme.Light
          ? "text-select_foreground-light bg-select_background-light"
          : "text-select_foreground-dark bg-select_background-dark"
      } ${className}`}
    >
      {options.map((option) => (
        <option
          className={
            theme === Theme.Light
              ? "text-select_foreground-light"
              : "text-select_foreground-dark"
          }
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};
