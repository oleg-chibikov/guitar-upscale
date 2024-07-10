import { v4 as uuidv4 } from "uuid";

export class IdGenerator {
  static generate(prefix?: string): string {
    return `${prefix}${uuidv4()}`;
  }
}
