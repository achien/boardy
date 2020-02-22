// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function memoize<Tr, Ta extends any[]>(
  f: (...args: Ta) => Tr,
): (...args: Ta) => Tr {
  const cache: Record<string, Tr> = {};
  return function(...args: Ta): Tr {
    const key = JSON.stringify(args);
    if (key in cache) {
      return cache[key];
    }
    cache[key] = f.apply(this, args);
    return cache[key];
  };
}
