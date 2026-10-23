export function trailingDebounce<
  F extends (...args: Parameters<F>) => ReturnType<F>,
>(func: F, delay: number): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
