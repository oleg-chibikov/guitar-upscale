import { SongsterrMeta, songsterrMetaUrl } from "@/app/engine/songs/songsterr";
import { apiHandler } from "@/lib/apiHelper";
import { allowPagesOrigin } from "@/lib/cors";
import { HttpStatusCode } from "axios";
import createHttpError from "http-errors";
import type { NextApiRequest, NextApiResponse } from "next";

// Songsterr sends no CORS headers, so the browser reads the song details through this route.
const handle = async (
  req: NextApiRequest,
  res: NextApiResponse<SongsterrMeta>,
) => {
  allowPagesOrigin(res);
  const songId = Number(req.query.songId);
  if (!Number.isInteger(songId) || songId <= 0) {
    throw new createHttpError.BadRequest("songId must be a positive number");
  }
  const response = await fetch(songsterrMetaUrl(songId));
  if (response.status === HttpStatusCode.NotFound) {
    throw new createHttpError.NotFound(`No song ${songId} on Songsterr`);
  }
  if (!response.ok) {
    throw createHttpError(
      HttpStatusCode.BadGateway,
      `Songsterr answered ${response.status}`,
      { expose: true },
    );
  }
  const meta = (await response.json()) as SongsterrMeta;
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(HttpStatusCode.Ok).json({
    songId: meta.songId,
    revisionId: meta.revisionId,
    image: meta.image,
    artist: meta.artist,
    title: meta.title,
    tracks: meta.tracks.map(({ instrumentId, instrument, name, isEmpty }) => ({
      instrumentId,
      instrument,
      name,
      isEmpty,
    })),
    popularTrack: meta.popularTrack,
    popularTrackBass: meta.popularTrackBass,
  });
};

export default apiHandler({
  GET: handle,
});
