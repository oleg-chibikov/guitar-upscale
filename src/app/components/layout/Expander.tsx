import { WithChildren } from "@/app/helpers/withChildren";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import { FC } from "react";

interface ExpanderProps extends WithChildren {
  expanded: boolean;
  handleExpansion: (event: React.SyntheticEvent, expanded: boolean) => void;
  id: string;
  title: string;
  reverseIcon?: boolean;
}

export const Expander: FC<ExpanderProps> = ({
  expanded,
  handleExpansion,
  id,
  title,
  reverseIcon,
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
        sx={{
          pointerEvents: "none",
        }}
        expandIcon={
          reverseIcon ? (
            <ExpandMore
              sx={{
                pointerEvents: "auto",
              }}
            />
          ) : (
            <ExpandLess
              sx={{
                pointerEvents: "auto",
              }}
            />
          )
        }
        style={{
          minHeight: 0,
        }}
        id={id}
        aria-controls={id}
      >
        <Typography variant="caption">{title}</Typography>
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
