import {
  SongsterrSearchResult,
  songsterrSearchUrl,
} from "@/app/engine/songs/songsterr";
import { apiHandler } from "@/lib/apiHelper";
import { fetchSongsterr, invalidSongsterrAnswer } from "@/lib/songsterrProxy";
import { allowPagesOrigin } from "@/lib/cors";
import { HttpStatusCode } from "axios";
import createHttpError from "http-errors";
import type { NextApiRequest, NextApiResponse } from "next";

// Songsterr sends no CORS headers, so the browser searches through this route.
const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<SongsterrSearchResult[]>,
) => {
  allowPagesOrigin(res);
  const pattern = String(req.query.pattern ?? "").trim();
  if (!pattern) {
    throw new createHttpError.BadRequest("Type a band or a song to search");
  }
  const response = await fetchSongsterr(songsterrSearchUrl(pattern));
  if (!response.ok) {
    throw createHttpError(
      HttpStatusCode.BadGateway,
      `Songsterr answered ${response.status}`,
      { expose: true },
    );
  }
  const songs: unknown = await response.json();
  if (!Array.isArray(songs)) {
    throw invalidSongsterrAnswer();
  }
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  );
  res
    .status(HttpStatusCode.Ok)
    .json(
      songs
        .filter(
          (s): s is SongsterrSearchResult & { hasPlayer: true } =>
            s?.hasPlayer === true,
        )
        .map(({ songId, artist, title }) => ({ songId, artist, title })),
    );
};

export default apiHandler({
  GET: handle,
});
