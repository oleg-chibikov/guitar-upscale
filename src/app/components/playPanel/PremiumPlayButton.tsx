"use client";
import { BasePlayButton } from "./PlayButton";

export const PremiumPlayButton: React.FC = () => (
  <BasePlayButton
    onPlayExample={async (props) => {
      const playExample = (await import("@/app/engine/play/examplePlayer"))
        .playExample;
      await playExample(props);
    }}
  />
);
