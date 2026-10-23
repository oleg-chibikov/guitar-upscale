export const convertToTitleCase = (inputStr: string): string => {
  // Split the string by underscores
  const words: string[] = inputStr.split("_");

  // Capitalize each word
  const capitalizedWords: string[] = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );

  // Join the words with spaces
  const outputStr: string = capitalizedWords.join(" ");

  return outputStr;
};
