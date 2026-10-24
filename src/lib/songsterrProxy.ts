import { HttpStatusCode } from "axios";
import createHttpError from "http-errors";

const TIMEOUT_MS = 10_000;

// A stuck Songsterr call would hold the request until the platform kills it.
export const fetchSongsterr = async (url: string) => {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw createHttpError(
        HttpStatusCode.GatewayTimeout,
        "Songsterr took too long to answer",
        { expose: true },
      );
    }
    throw createHttpError(
      HttpStatusCode.BadGateway,
      "Songsterr can't be reached",
      { expose: true },
    );
  }
};

export const invalidSongsterrAnswer = () =>
  createHttpError(
    HttpStatusCode.BadGateway,
    "Songsterr sent an answer the app can't read",
    { expose: true },
  );
