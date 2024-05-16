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
    // Get the date components
    const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // Add leading zero if needed
    const day = ("0" + date.getDate()).slice(-2); // Add leading zero if needed
    const hours = ("0" + date.getHours()).slice(-2); // Add leading zero if needed
    const minutes = ("0" + date.getMinutes()).slice(-2); // Add leading zero if needed

    // Construct the formatted date string
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedDate;
  }
  return undefined;
};
