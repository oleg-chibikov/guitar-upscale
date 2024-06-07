// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
export const cartesian = <T>(...args: T[][]): (T | null)[][] =>
  args.reduce<(T | null)[][]>(
    (acc, curr) => {
      if (!curr.length) {
        for (const item of acc) {
          item.push(null);
        }
        return acc;
      }
      return acc.flatMap((x) => curr.map((y) => [...x, y]));
    },
    [[]]
  );
