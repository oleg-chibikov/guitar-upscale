import { selectControlPanel } from "@/app/store/controlPanelSlice";
import React from "react";
import { useSelector } from "react-redux";

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

  const { themeString } = useSelector(selectControlPanel);
  return (
    <div>
      <input
        type="checkbox"
        className={`mr-2 accent-primary-${themeString}`}
        id={label}
        checked={value}
        onChange={handleChange}
      />
      <label className={`text-foreground-${themeString}`} htmlFor={label}>
        {label}
      </label>
    </div>
  );
};
