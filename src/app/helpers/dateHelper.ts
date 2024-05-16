const dateFormatOptions: Intl.DateTimeFormatOptions = {
  weekday: "short",
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
};

const msToDate = (ms?: number) => (ms ? new Date(ms) : undefined);

export const msToFormattedDate = (ms?: number) => {
  const date = msToDate(ms);
  if (date) {
    return date.toLocaleDateString("en", dateFormatOptions);
  }
  return undefined;
};
