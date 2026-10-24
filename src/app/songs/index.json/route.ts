import { buildSongIndex } from "@/app/engine/songs/songIndex";

// next build saves the list as a file. next dev builds it on each request, so a new song file shows up on reload
export const dynamic = "force-static";

export const GET = async () => Response.json(await buildSongIndex());
