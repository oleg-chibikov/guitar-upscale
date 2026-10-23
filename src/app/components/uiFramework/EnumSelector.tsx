import { WithClassName } from "@/app/helpers/withClassName";
import { SelectWrapper } from "./SelectWrapper";

interface EnumSelectorProps<
  T extends Record<string | number, string | number>,
> extends WithClassName {
  enumObj: T;
  selectedValue: T[keyof T];
  onValueChange: (value: T[keyof T]) => void;
  customLabel?: (key: string, value: T[keyof T]) => string;
  disabled?: boolean;
  tooltip?: string;
}

export function EnumSelector<
  T extends Record<string | number, string | number>,
>({
  enumObj,
  selectedValue,
  onValueChange,
  customLabel,
  ...rest
}: EnumSelectorProps<T>) {
  const options = Object.entries(enumObj)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({
      value: String(value),
      label:
        customLabel?.(String(key), value as T[keyof T]) ??
        String(key.replace(/_/g, " ")),
    }));

  return (
    <SelectWrapper
      {...rest}
      options={options}
      value={String(selectedValue)}
      onChange={(value: string | number) => {
        const enumValue = Object.values(enumObj).find(
          (v) => String(v) === String(value),
        );
        if (enumValue !== undefined) {
          onValueChange(enumValue as T[keyof T]);
        }
      }}
    />
  );
}
