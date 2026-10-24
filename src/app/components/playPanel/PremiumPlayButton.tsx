"use client";
import { BasePlayButton } from "./PlayButton";

interface PremiumPlayButtonProps {
  canImportSongs?: boolean;
}

export const PremiumPlayButton: React.FC<PremiumPlayButtonProps> = ({
  canImportSongs,
}) => (
  <BasePlayButton
    canImportSongs={canImportSongs}
    decodeExample={async (props) => {
      const decodeExample = (
        await import("@/app/engine/decoders/exampleDecoder")
      ).decodeExample;
      return decodeExample(props);
    }}
  />
);
