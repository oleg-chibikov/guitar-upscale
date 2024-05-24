interface TrieInterface {
  add(str: string): void;
  wildcardMatches(pattern: string): Set<string>;
  contains(str: string): boolean;
  prefixedWords(str: string): Set<string>;
  remove(str: string): void;
  clear(): void;
  size(): number;
}

class Node {
  children: Map<string, Node>;
  isEnd: boolean;

  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

export class Trie implements TrieInterface {
  private readonly root: Node;
  private trieSize: number;

  public static readonly WILDCARD_QUESTION_MARK = "?";
  public static readonly WILDCARD_STAR = "*";

  constructor() {
    this.root = new Node();
    this.trieSize = 0;
  }

  public add(str: string): void {
    let curr = this.root;
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      if (!curr.children.has(char)) {
        curr.children.set(char, new Node());
      }
      curr = curr.children.get(char)!;
    }
    if (!curr.isEnd) {
      this.trieSize++;
    }
    curr.isEnd = true;
  }

  private getNode(str: string): Node | null {
    let node = this.root;
    for (let i = 0; i < str.length; i++) {
      const child = node.children.get(str.charAt(i));
      if (!child) {
        return null;
      }
      node = child;
    }
    return node;
  }

  public wildcardMatches(pattern: string): Set<string> {
    const wildcardMatches = new Set<string>();
    this.wildcardTraverse(pattern, "", this.root, 0, wildcardMatches);
    return wildcardMatches;
  }

  private wildcardTraverse(
    pattern: string,
    prefix: string,
    root: Node,
    len: number,
    wildcardMatches: Set<string>
  ): void {
    // if (!root) {
    //   return;
    // }
    if (len === pattern.length) {
      if (root.isEnd) {
        wildcardMatches.add(prefix);
      }
      return;
    }
    const children = Array.from(root.children);
    const char = pattern.charAt(len);
    if (char === Trie.WILDCARD_QUESTION_MARK) {
      for (const [key, child] of children) {
        this.wildcardTraverse(
          pattern,
          prefix + key,
          child,
          len + 1,
          wildcardMatches
        );
      }
    } else if (char === Trie.WILDCARD_STAR) {
      this.wildcardTraverse(pattern, prefix, root, len + 1, wildcardMatches);
      for (const [key, child] of children) {
        this.wildcardTraverse(
          pattern,
          prefix + key,
          child,
          len,
          wildcardMatches
        );
      }
    } else {
      const child = root.children.get(char);
      if (child !== undefined) {
        this.wildcardTraverse(
          pattern,
          prefix + char,
          child,
          len + 1,
          wildcardMatches
        );
      }
    }
  }

  public contains(str: string): boolean {
    const node = this.getNode(str);
    return node !== null && node.isEnd;
  }

  public prefixedWords(str: string): Set<string> {
    const curr = this.getNode(str);
    const prefixedWords: string[] = [];
    this.DFS(curr, str, prefixedWords);
    return new Set(prefixedWords);
  }

  private DFS(root: Node | null, prefix: string, list: string[]): void {
    if (!root) {
      return;
    }
    if (root.isEnd) {
      list.push(prefix);
    }

    const children = Array.from(root.children);
    for (const [key, child] of children) {
      this.DFS(child, prefix + key, list);
    }
  }

  private removeUtil(node: Node | null, str: string, level: number): boolean {
    if (node) {
      if (level === str.length) {
        if (node.isEnd) {
          node.isEnd = false;
          return node.children.size === 0;
        }
      } else {
        const nextNode = node.children.get(str.charAt(level)) || null;
        if (this.removeUtil(nextNode, str, level + 1)) {
          node.children.delete(str.charAt(level));
          return !node.isEnd && node.children.size === 0;
        }
      }
    }
    return false;
  }

  public clear(): void {
    this.root.children.clear();
    this.trieSize = 0;
  }

  public remove(str: string): void {
    if (this.contains(str)) {
      this.removeUtil(this.root, str, 0);
      this.trieSize--;
    }
  }

  public size(): number {
    return this.trieSize;
  }
}
