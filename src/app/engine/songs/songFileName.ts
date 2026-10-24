// Reads "Band - Title.gp" style names. It imports nothing, so the scripts can load it with Node's type stripping.
export const parseBandAndTitle = (fileName: string) => {
  const name = fileName.replace(/\.[^.]+$/, "");
  const separator = name.indexOf(" - ");
  return separator === -1
    ? { band: "", title: name }
    : {
        band: name.slice(0, separator).trim(),
        title: name.slice(separator + 3).trim(),
      };
};
