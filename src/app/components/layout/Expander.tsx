import { WithChildren } from "@/app/helpers/withChildren";
import { WithId } from "@/app/helpers/withId";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import { FC } from "react";

interface ExpanderProps extends WithChildren, WithId {
  expanded: boolean;
  handleExpansion: (event: React.SyntheticEvent, expanded: boolean) => void;
  title: string;
  reverseIcon?: boolean;
  expandOnlyOnIcon?: boolean;
}

export const Expander: FC<ExpanderProps> = ({
  expanded,
  handleExpansion,
  id,
  title,
  reverseIcon,
  expandOnlyOnIcon,
  children,
}) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={handleExpansion}
      // slots={{ transition: Fade as AccordionSlots["transition"] }}
      // slotProps={{ transition: { timeout: 400 } }}
      sx={{
        "& .MuiAccordionSummary-content": {
          margin: 0,
          marginY: 0.5,
        },
      }}
      disableGutters
    >
      <AccordionSummary
        sx={
          expandOnlyOnIcon
            ? {
                pointerEvents: "none",
              }
            : undefined
        }
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
        <Typography variant="h6">{title}</Typography>
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
  );
};
