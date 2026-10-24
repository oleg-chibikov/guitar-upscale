import { format } from "date-fns";

export const msToFormattedDate = (ms?: number) =>
  ms !== undefined && ms > 0 ? format(ms, "yy-MM-dd HH:mm") : undefined;
