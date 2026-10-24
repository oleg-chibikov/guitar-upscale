import { formatStrums } from "./strummingPatterns";

describe("formatStrums", () => {
  it("writes a rest as an underscore", () => {
    expect(formatStrums(["↓", "", "↑"])).toBe("↓_↑");
  });

  it("puts a space after every 4 strums", () => {
    expect(formatStrums(["↓", "↑", "↓", "↑", "↓", "", "", "↑", "↓"])).toBe(
      "↓↑↓↑ ↓__↑ ↓",
    );
  });

  it("leaves no space at the end", () => {
    expect(formatStrums(["↓", "↑", "↓", "↑"])).toBe("↓↑↓↑");
  });

  it("writes an empty pattern as an empty string", () => {
    expect(formatStrums([])).toBe("");
  });
});
