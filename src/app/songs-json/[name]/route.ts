import { getSongJsonName } from "@/app/engine/songs/songJson";
import {
  findSongFileByJsonName,
  listSongFiles,
  readBuiltInSong,
} from "@/app/engine/songs/songIndex";

// next build saves one JSON file per song, so the app loads a built-in song without alphaTab
export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () =>
  listSongFiles().map((name) => ({ name: getSongJsonName(name) }));

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) => {
  const songFile = findSongFileByJsonName(
    decodeURIComponent((await params).name),
  );
  if (songFile === undefined) {
    return new Response(null, { status: 404 });
  }
  return Response.json(await readBuiltInSong(songFile));
};
