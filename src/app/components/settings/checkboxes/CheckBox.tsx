import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
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

  const { theme } = useSelector(selectUi);
  return (
    <div className="flex flex-row gap-2">
      <input
        type="checkbox"
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
        {label}
      </label>
    </div>
  );
};
