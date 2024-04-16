import colors from "tailwindcss/colors";

// Function to get hex value of a Tailwind CSS color class
export function getHexValue(className: string) {
  // Split the className into parts
  const parts = className.split("-");

  // Extract the color name and shade
  const colorName = parts[1];
  const shade = parts[2];

  // Get the color object from Tailwind's configuration
  const colorObject = (
    colors as unknown as Record<string, Record<string, string>>
  )[colorName];

  // If color object and shade exist, return hex value, otherwise return null
  return colorObject && colorObject[shade] ? colorObject[shade] : null;
}
