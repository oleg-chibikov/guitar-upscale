import React from "react";

interface GuitarImageProps {
  asset: string;
  onLoad?: () => void; // Define onLoad as an optional prop
  className?: string;
}

export const GuitarImage: React.FC<GuitarImageProps> = ({
  asset,
  onLoad,
  className,
}) => {
  return (
    // Use standard img tag to offload traffic from vercel (which contributes to usage)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`origin-top-left ${className}`}
      // loader={imageLoader}
      style={{
        maxWidth: "unset",
        width: 5504,
        height: 2200,
        transform: "scale(0.662)", // Scale the image to fit the Fretboard class
      }}
      width={5504}
      height={2200}
      onLoad={onLoad}
      src={asset}
      alt="Guitar"
    />
  );
};
