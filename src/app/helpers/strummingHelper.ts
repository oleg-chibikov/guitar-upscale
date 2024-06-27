import { StrumDirection } from "@/app/data/strummingData";

export const formatStrums = (strums: StrumDirection[]): string =>
  strums
    .map((strum, index) => {
      let separator = "";
      if (index < strums.length - 1) {
        if ((index + 1) % 8 === 0) {
          separator = "|";
        } else if ((index + 1) % 4 === 0) {
          separator = " ";
        }
      }
      return strum + separator;
    })
    .join("");
