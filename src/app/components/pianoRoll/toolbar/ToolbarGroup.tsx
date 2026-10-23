import React, { ReactNode } from "react";

// buttons that belong together sit on one rounded strip
export const Group: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`flex flex-row items-center shrink-0 rounded-md bg-white/5 overflow-hidden ${className}`}
  >
    {children}
  </div>
);
