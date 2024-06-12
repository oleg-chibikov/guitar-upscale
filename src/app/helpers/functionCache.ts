export class FunctionCache<T extends (...args: any[]) => any> {
  private cache: Map<string, ReturnType<T>> = new Map();

  LOG_PREFIX = "Cache: ";
  constructor(private func: T) {}

  execute(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (this.cache.has(key)) {
      console.log(this.LOG_PREFIX + "Getting result from cache for", key);
      return this.cache.get(key) as ReturnType<T>;
    }

    console.log(this.LOG_PREFIX + "Executing function for", key);
    const result = this.func(...args);
    this.cache.set(key, result);
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheKey(...args: Parameters<T>): void {
    const key = JSON.stringify(args);
    this.cache.delete(key);
  }
}
