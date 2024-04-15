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

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <input
        type="checkbox"
        id={label}
        checked={value}
        onChange={handleChange}
        style={{ marginRight: "8px" }}
      />
      <label htmlFor={label}>{label}</label>
    </div>
  );
};
