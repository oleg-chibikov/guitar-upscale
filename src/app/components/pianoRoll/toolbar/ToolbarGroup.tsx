import React, { ReactNode } from "react";

// buttons that belong together sit on one rounded strip
export const Group: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`flex shrink-0 flex-row items-center overflow-hidden rounded-md bg-white/5 ${className}`}
  >
    {children}
  </div>
);
