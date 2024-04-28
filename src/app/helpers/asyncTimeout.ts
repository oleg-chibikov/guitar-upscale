export const asyncTimeout = (func: () => Promise<void>, ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(async () => {
      await func();
      resolve();
    }, ms);
  });
};
