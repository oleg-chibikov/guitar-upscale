import { StrumDirection } from "@/app/data/strummingData";

export const formatStrums = (strums: StrumDirection[]): string =>
  strums
    .map((strum, index) => {
      const separator =
        index < strums.length - 1 && (index + 1) % 4 === 0 ? " " : "";

      return (strum || "_") + separator;
    })
    .join("");
