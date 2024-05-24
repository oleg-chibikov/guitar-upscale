import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import React from "react";
import { useSelector } from "react-redux";

interface SelectWrapperProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  className?: string;
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
      onChange={(event) => onChange !== undefined && onChange(event.target.value)}
      className={`${
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
