"use client";
import { BasePlayButton } from "./PlayButton";

export const PremiumPlayButton: React.FC = () => (
  <BasePlayButton
    decodeExample={async (props) => {
      const decodeExample = (
        await import("@/app/engine/decoders/exampleDecoder")
      ).decodeExample;
      return decodeExample(props);
    }}
  />
);
