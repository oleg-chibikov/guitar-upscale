export const createPromise = () => {
  let resolveCurrentPromise: (value: void | PromiseLike<void>) => void;
  let promise: Promise<void>;
  const recreatePromise = () => {
    promise = new Promise<void>((resolve) => {
      resolveCurrentPromise = resolve;
    });
  };

  recreatePromise();

  const waitFor = async () => {
    await promise;
  };

  return {
    waitFor,
    recreate: (stopOnly: boolean = false) => {
      resolveCurrentPromise();
      if (!stopOnly) {
        recreatePromise();
      }
    },
  };
};
