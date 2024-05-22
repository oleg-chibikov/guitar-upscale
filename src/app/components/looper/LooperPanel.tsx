"use client";

import {
  LOOPER_CHANNEL_COUNT,
  LooperState,
  looperState,
} from "@/app/engine/looper";
import { useState } from "react";
import { LooperButton } from "./LooperButton";

export const LooperPanel: React.FC = () => {
  const [state, setState] = useState<LooperState>(looperState);
  return (
    <div
      className="flex p-1 bg-panel-dark fixed bottom-1 gap-1 justify-between"
      style={{ right: 190 }}
    >
      {[...Array(LOOPER_CHANNEL_COUNT)].map((_, index) => (
        <div key={index}>
          <LooperButton
            channel={index}
            state={state[index]}
            setState={setState}
          />
        </div>
      ))}
    </div>
  );
};
