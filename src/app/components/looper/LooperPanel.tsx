"use client";

import { AddLooperChannelButton } from "@/app/components/looper/AddLooperChannelButton";
import { RemoveLooperChannelButton } from "@/app/components/looper/RemoveLooperChannelButton";
import {
  LooperState,
  canAddChannel,
  canRemoveChannel,
  looperState,
} from "@/app/engine/looper";
import { useState } from "react";
import { LooperButton } from "./LooperButton";

export const LooperPanel: React.FC = () => {
  const [state, setState] = useState<LooperState>(looperState);
  const showPlay = Object.values(state).some((x) => x.hasRecording); // after being restored from the state array is converted to an object and just applying .some won't work
  return (
    <div
      className="flex p-1 bg-panel-dark fixed bottom-8 gap-1 justify-between"
      style={{ right: 32 }}
    >
      <RemoveLooperChannelButton
        setState={setState}
        disabled={!canRemoveChannel()}
      />
      {looperState.map((_, index) => (
        <div key={index}>
          <LooperButton
            channel={index}
            state={state[index]}
            setState={setState}
            showPlay={showPlay}
          />
        </div>
      ))}
      <AddLooperChannelButton setState={setState} disabled={!canAddChannel()} />
    </div>
  );
};
