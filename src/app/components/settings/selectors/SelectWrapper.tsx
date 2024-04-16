import { selectControlPanel } from "@/app/store/controlPanelSlice";
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
  const { themeString } = useSelector(selectControlPanel);

  return (
    <select
      value={value}
      onChange={(event) => onChange && onChange(event.target.value)}
      className={`text-background-${themeString} bg-foreground-${themeString} ${className}`}
    >
      {options.map((option) => (
        <option
          className={`text-background-${themeString} hover:bg-background-${themeString}`}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};
