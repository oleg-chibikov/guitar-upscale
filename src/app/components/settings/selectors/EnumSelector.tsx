import React from "react";

interface EnumSelectorProps<
  T extends Record<string | number, string | number>
> {
  enumObj: T;
  selectedValue: T[keyof T];
  onValueChange: (value: T[keyof T]) => void;
  customLabel?: (key: string, value: T[keyof T]) => string;
}

export function EnumSelector<
  T extends Record<string | number, string | number>
>({
  enumObj,
  selectedValue,
  onValueChange,
  customLabel,
}: EnumSelectorProps<T>) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value);
    onValueChange(value as any);
  };

  return (
    <select value={selectedValue} onChange={handleChange}>
      {Object.entries(enumObj)
        .filter(([key]) => isNaN(Number(key)))
        .map(([key, value]) => (
          <option key={key} value={value}>
            {customLabel?.(String(key), value as T[keyof T]) ?? String(key)}
          </option>
        ))}
    </select>
  );
}
