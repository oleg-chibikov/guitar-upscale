import React from "react";

export const Timeline: React.FC = () => {
  const ticks = Array.from({ length: 100 }, (_, i) => i * 100);

  return (
    <div className="h-8 bg-gray-200 border-b border-gray-300 relative">
      {ticks.map((tick) => (
        <div
          key={tick}
          className="absolute h-full border-l border-gray-400"
          style={{ left: `${tick}px` }}
        >
          <span className="absolute top-0 left-1 text-xs">{tick}</span>
        </div>
      ))}
    </div>
  );
};
