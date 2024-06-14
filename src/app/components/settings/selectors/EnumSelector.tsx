import { WithClassName } from "@/app/helpers/WithClassName";
import { SelectWrapper } from "./SelectWrapper";

interface EnumSelectorProps<T extends Record<string | number, string | number>>
  extends WithClassName {
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
  className,
}: EnumSelectorProps<T>) {
  const options = Object.entries(enumObj)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({
      value,
      label:
        customLabel?.(String(key), value as T[keyof T]) ??
        String(key.replace(/_/g, " ")),
    }));

  return (
    <SelectWrapper
      className={className}
      options={options}
      value={selectedValue.toString()}
      onChange={(value: string | number) =>
        onValueChange(parseInt(value as string) as T[keyof T])
      }
    />
  );
}
