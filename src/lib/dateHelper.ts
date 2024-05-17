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

export function msToTime(durationMs: number) {
  const milliseconds = (durationMs % 1000) / 100;
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  return {
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    milliseconds: milliseconds,
  };
}
