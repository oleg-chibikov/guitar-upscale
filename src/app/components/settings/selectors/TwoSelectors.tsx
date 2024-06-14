import React from "react";
import { useSelector } from "react-redux";

import { Theme } from "@/app/data/theme";
import { WithChildren } from "@/app/helpers/withChildren";
import { selectUi } from "@/app/store/uiSlice";

export const TwoSelectors: React.FC<WithChildren> = ({ children }) => {
  const { theme } = useSelector(selectUi);

  return (
    <section
      className={`p-1 gap-x-2 gap-y-3 grid ${
        theme === Theme.Light
          ? "text-foreground-light bg-accented_background-light"
          : "text-foreground-dark bg-accented_background-dark"
      }`}
      style={{
        gridTemplateColumns: "auto 75px",
      }}
    >
      {children}
    </section>
  );
};
