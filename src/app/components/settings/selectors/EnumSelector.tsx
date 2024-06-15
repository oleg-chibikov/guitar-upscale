import { WithClassName } from "@/app/helpers/withClassName";
import { SelectWrapper } from "./SelectWrapper";

interface EnumSelectorProps<T extends Record<string | number, string | number>>
  extends WithClassName {
  enumObj: T;
  selectedValue: T[keyof T];
  onValueChange: (value: T[keyof T]) => void;
  customLabel?: (key: string, value: T[keyof T]) => string;
  large?: boolean;
}

export function EnumSelector<
  T extends Record<string | number, string | number>
>({
  enumObj,
  selectedValue,
  onValueChange,
  customLabel,
  className,
  large,
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
      large={large}
      className={className}
      options={options}
      value={selectedValue.toString()}
      onChange={(value: string | number) =>
        onValueChange(parseInt(value as string) as T[keyof T])
      }
    />
  );
}
