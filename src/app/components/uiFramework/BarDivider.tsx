import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { FC } from "react";

/**
 * A thin line between groups of controls in a bar.
 */
export const BarDivider: FC = () => {
  const theme = useUiSelector((s) => s.theme);
  return (
    <div
      className={`my-1 w-px shrink-0 self-stretch ${
        theme === Theme.Light ? "bg-bar_border-light" : "bg-bar_border-dark"
      }`}
    />
  );
};
