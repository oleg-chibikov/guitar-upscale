import { CHROMATIC } from "@/app/data/scaleDefinitions";
import { Note, getNoteText } from "@/app/data/notes";

interface KeyDescriptionInput {
  root: Note;
  scaleGroup: string;
  scale: string;
  tuningName: string;
  capo: number;
}

/**
 * The short text for the key button, such as "E Minor" over "Aeolian / Natural · E standard".
 */
export const describeKey = ({
  root,
  scaleGroup,
  scale,
  tuningName,
  capo,
}: KeyDescriptionInput) => {
  const rootText = getNoteText(root);
  // the chromatic scale holds every note, so the root says nothing about it
  const title =
    scale === CHROMATIC
      ? "All notes"
      : scaleGroup !== ""
        ? `${rootText} ${scaleGroup}`
        : rootText;
  const details = [
    scale === CHROMATIC ? "" : scale,
    tuningName,
    capo > 0 ? `Capo ${capo}` : "",
  ].filter((part) => part !== "");
  return { title, details: details.join(" · ") };
};
