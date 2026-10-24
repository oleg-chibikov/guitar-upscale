import { Panel } from "@/app/components/uiFramework/Panel";
import React, { ReactNode } from "react";

// buttons that belong together, without a frame of their own
export const Group: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <Panel bare className={`shrink-0 ${className}`}>
    {children}
  </Panel>
);
