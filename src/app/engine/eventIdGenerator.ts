export class IdGenerator {
  private static counter = 0;

  static generate(prefix?: string): string {
    const timestamp = Date.now();
    const uniqueCounter = (++this.counter).toString().padStart(3, "0");
    return `${prefix}${timestamp}-${uniqueCounter}`;
  }
}
