import { Trie } from "./trie";

describe("TrieTest", () => {
  let trie: Trie;

  beforeAll(() => {
    trie = new Trie();
    trie.add("cat");
    trie.add("cape");
    trie.add("bear");
    trie.add("core");
  });

  test("containsTest", () => {
    expect(trie.contains("bear")).toBeTruthy();
    expect(trie.contains("core")).toBeTruthy();
    expect(trie.contains("cape")).toBeTruthy();
    expect(trie.contains("cat")).toBeTruthy();
  });

  test("wildcardTest1", () => {
    const expected = new Set<string>(["cat"]);
    expect(trie.wildcardMatches("ca?")).toEqual(expected);
  });

  test("wildcardTest2", () => {
    const expected = new Set<string>(["cat"]);
    expect(trie.wildcardMatches("?a?")).toEqual(expected);
  });

  test("wildcardTest3", () => {
    const expected = new Set<string>(["cape", "core"]);
    expect(trie.wildcardMatches("c??e")).toEqual(expected);
  });

  test("wildcardTest4", () => {
    const expected = new Set<string>(["cape", "core", "bear"]);
    expect(trie.wildcardMatches("????")).toEqual(expected);
  });

  test("prefixedWordsTest1", () => {
    const expected = new Set<string>(["cat", "cape", "core"]);
    expect(trie.prefixedWords("c")).toEqual(expected);
  });

  test("prefixedWordsTest2", () => {
    const expected = new Set<string>(["bear"]);
    expect(trie.prefixedWords("b")).toEqual(expected);
  });

  test("prefixedWordsTest3", () => {
    const expected = new Set<string>();
    expect(trie.prefixedWords("bbb")).toEqual(expected);
  });

  test("prefixedWordsTest4", () => {
    const expected = new Set<string>(["cape", "cat"]);
    expect(trie.prefixedWords("ca")).toEqual(expected);
  });

  test("removeTest", () => {
    const trie = new Trie();
    trie.add("cat");
    trie.add("cape");
    trie.add("bear");
    trie.add("core");
    trie.remove("core");
    let expected = new Set<string>(["cape", "cat", "bear"]);
    expect(getAll(trie)).toEqual(expected);

    trie.remove("cat");
    expected.delete("cat");
    expect(getAll(trie)).toEqual(expected);

    trie.add("cactus");
    expected.add("cactus");
    expect(getAll(trie)).toEqual(expected);

    const NOT_IN_TRIE = "asdfgh";
    trie.remove(NOT_IN_TRIE);
    expect(getAll(trie)).toEqual(expected);
  });

  test("sizeTest", () => {
    const trie = new Trie();
    expect(trie.size()).toBe(0);

    trie.add("core");
    trie.add("core");
    expect(trie.size()).toBe(1);

    trie.add("bar");
    expect(trie.size()).toBe(2);

    trie.remove("bar");
    expect(trie.size()).toBe(1);

    trie.remove("core");
    expect(trie.size()).toBe(0);
  });

  test("clearTest", () => {
    const emptySet = new Set<string>();
    const trie = new Trie();
    trie.add("core");
    trie.add("ab");
    trie.add("nc");
    trie.clear();
    expect(getAll(trie)).toEqual(emptySet);
    expect(trie.size()).toBe(0);
  });
});

function getAll(trie: Trie): Set<string> {
  return new Set(trie.prefixedWords(""));
}
