import { Theme } from "@/app/data/theme";
import { WithChildren } from "@/app/helpers/withChildren";
import { WithClassName } from "@/app/helpers/withClassName";
import { WithId } from "@/app/helpers/withId";
import { WithStyle } from "@/app/helpers/withStyle";
import { useUiSelector } from "@/app/hooks/storeHooks";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import { FC, ReactNode, Ref } from "react";

interface ExpanderProps extends WithChildren, WithId, WithClassName, WithStyle {
  expanded: boolean;
  handleExpansion: (event: React.SyntheticEvent, expanded: boolean) => void;
  title: string;
  reverseIcon?: boolean;
  expandOnlyOnIcon?: boolean;
  // shown in the header next to the title. A press on it doesn't toggle the expander
  headerAction?: ReactNode;
  ref?: Ref<HTMLElement>;
}

export const Expander: FC<ExpanderProps> = ({
  id,
  children,
  className,
  style,
  expanded,
  handleExpansion,
  title,
  reverseIcon = false,
  expandOnlyOnIcon = false,
  headerAction,
  ref,
}) => {
  const theme = useUiSelector((s) => s.theme);
  return (
    <section
      ref={ref}
      style={style}
      className={`${className} rounded-xl border p-1.5 ${
        theme === Theme.Light
          ? "border-bar_border-light bg-bar-light"
          : "border-bar_border-dark bg-bar-dark"
      }`}
    >
      <Accordion
        expanded={expanded}
        onChange={handleExpansion}
        // slots={{ transition: Fade as AccordionSlots["transition"] }}
        // slotProps={{ transition: { timeout: 400 } }}
        sx={{
          bgcolor: "transparent",
          backgroundImage: "none",
          boxShadow: "none",
          "&::before": { display: "none" },
          "& .MuiAccordionSummary-content": {
            margin: 0,
            marginY: 0.25,
          },
        }}
        disableGutters
      >
        <AccordionSummary
          sx={{
            px: 0.75,
            ...(expandOnlyOnIcon ? { pointerEvents: "none" } : {}),
          }}
          expandIcon={
            reverseIcon ? (
              <ExpandMore
                sx={
                  expandOnlyOnIcon
                    ? {
                        pointerEvents: "auto",
                      }
                    : undefined
                }
              />
            ) : (
              <ExpandLess
                sx={
                  expandOnlyOnIcon
                    ? {
                        pointerEvents: "auto",
                      }
                    : undefined
                }
              />
            )
          }
          style={{
            minHeight: 0,
          }}
          id={id}
          aria-controls={id}
        >
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              {title}
            </Typography>
            {headerAction !== undefined && (
              <span
                style={{ pointerEvents: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                {headerAction}
              </span>
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails
          className="flex flex-col gap-2"
          style={{
            padding: 0,
            // paddingTop: 10, // give area to tap top chords
          }}
        >
          {children}
        </AccordionDetails>
      </Accordion>
    </section>
  );
};
