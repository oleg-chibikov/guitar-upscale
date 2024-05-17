type Func<T extends unknown[], R> = (...args: T) => R;

export function trailingDebounce<T extends unknown[], R>(
  func: Func<T, R>,
  delay: number
): (...args: T) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: unknown, ...args: T) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
