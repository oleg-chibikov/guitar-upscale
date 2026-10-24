import { WithChildren } from "@/app/helpers/withChildren";
import { Typography } from "@mui/material";
import { createContext, FC, useContext, useId } from "react";

// a select or a slider inside reads the label id to name itself
const LabelIdContext = createContext<string | undefined>(undefined);

export const useControlLabelId = () => useContext(LabelIdContext);

interface ControlWithLabelProps extends WithChildren {
  label: string;
  subtitle?: string;
}

export const ControlWithLabel: FC<ControlWithLabelProps> = ({
  children,
  label,
  subtitle,
}) => {
  const labelId = useId();
  return (
    <>
      <Typography id={labelId} className="flex items-center select-text">
        {label}:
      </Typography>
      {subtitle !== undefined && (
        <Typography variant="subtitle1" className="select-text">
          {subtitle}:
        </Typography>
      )}
      <LabelIdContext.Provider value={labelId}>
        {children}
      </LabelIdContext.Provider>
    </>
  );
};
