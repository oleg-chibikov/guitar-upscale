type Func<T extends any[], R> = (...args: T) => R;

export function trailingDebounce<T extends any[], R>(
  func: Func<T, R>,
  delay: number
): (...args: T) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: T) {
    const context = this;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
