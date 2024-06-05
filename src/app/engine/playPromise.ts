import { createPromise } from "@/app/helpers/promiseHelper";

const { waitFor: waitForPlaybackToFinish, recreate: recreatePlaybackPromise } =
  createPromise();

export { recreatePlaybackPromise, waitForPlaybackToFinish };
