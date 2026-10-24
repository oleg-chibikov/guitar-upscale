import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import { WithStyle } from "@/app/helpers/withStyle";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { FC } from "react";

export const Panel: FC<
  WithChildren &
    WithClassName &
    WithStyle &
    // bare drops the frame, for a group inside another bar
    WithId & { enableReverse?: boolean; bare?: boolean }
> = ({
  children,
  className,
  style,
  id,
  enableReverse = false,
  bare = false,
}) => {
  const theme = useUiSelector((s) => s.theme);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const frame = bare
    ? ""
    : `rounded-xl border p-1.5 overflow-auto overscroll-contain ${
        theme === Theme.Light
          ? "border-bar_border-light bg-bar-light"
          : "border-bar_border-dark bg-bar-dark"
      }`;
  return (
    <section
      id={id}
      style={style}
      className={`${className !== undefined ? `${className} ` : ""}${frame} flex ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left && enableReverse
          ? "flex-row-reverse"
          : "flex-row"
      } items-center gap-1.5`}
    >
      {children}
    </section>
  );
};
