import {
  SongsterrSearchResult,
  songsterrSearchUrl,
} from "@/app/engine/songs/songsterr";
import { apiHandler } from "@/lib/apiHelper";
import { HttpStatusCode } from "axios";
import createHttpError from "http-errors";
import type { NextApiRequest, NextApiResponse } from "next";

// Songsterr sends no CORS headers, so the browser searches through this route.
const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<SongsterrSearchResult[]>,
) => {
  const pattern = String(req.query.pattern ?? "").trim();
  if (!pattern) {
    throw new createHttpError.BadRequest("Type a band or a song to search");
  }
  const response = await fetch(songsterrSearchUrl(pattern));
  if (!response.ok) {
    throw createHttpError(
      HttpStatusCode.BadGateway,
      `Songsterr answered ${response.status}`,
      { expose: true },
    );
  }
  const songs = (await response.json()) as (SongsterrSearchResult & {
    hasPlayer?: boolean;
  })[];
  res.setHeader("Cache-Control", "public, max-age=3600");
  res
    .status(HttpStatusCode.Ok)
    .json(
      songs
        .filter((s) => s.hasPlayer === true)
        .map(({ songId, artist, title }) => ({ songId, artist, title })),
    );
};

export default apiHandler({
  GET: handle,
});
