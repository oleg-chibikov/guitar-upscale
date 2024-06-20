import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import { WithStyle } from "@/app/helpers/withStyle";
import { selectUi } from "@/app/store/uiSlice";
import { FC } from "react";
import { useSelector } from "react-redux";

export const Panel: FC<
  WithChildren &
    WithClassName &
    WithStyle &
    WithId & { enableReverse?: boolean }
> = ({ children, className, style, id, enableReverse = false }) => {
  const { theme, chordsDisplayMode } = useSelector(selectUi);
  return (
    <section
      id={id}
      style={style}
      className={`${className ? `${className} ` : ""}border-2 ${
        theme === Theme.Light
          ? "bg-panel-light border-border-light"
          : "bg-panel-dark border-border-dark"
      } flex ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left && enableReverse
          ? "flex-row-reverse"
          : "flex-row"
      } gap-1 items-center overflow-auto overscroll-contain`}
    >
      {children}
    </section>
  );
};
