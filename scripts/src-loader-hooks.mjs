// Node hooks that let a script import app code from src: they map the @/ alias,
// add the missing .ts extension and compile TypeScript, enums included.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SRC_URL = new URL("../src/", import.meta.url);
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

const findFile = (url) =>
  EXTENSIONS.map((extension) => new URL(url.href + extension)).find(
    (candidate) => {
      const stat = fs.statSync(fileURLToPath(candidate), {
        throwIfNoEntry: false,
      });
      return stat?.isFile() === true;
    },
  );

const isAppFile = (url) => url?.startsWith(SRC_URL.href) === true;

export const resolve = (specifier, context, nextResolve) => {
  let base;
  if (specifier.startsWith("@/")) {
    base = new URL(specifier.slice(2), SRC_URL);
  } else if (specifier.startsWith(".") && isAppFile(context.parentURL)) {
    base = new URL(specifier, context.parentURL);
  }
  const file = base && findFile(base);
  return file
    ? { url: file.href, shortCircuit: true }
    : nextResolve(specifier, context);
};

export const load = (url, context, nextLoad) => {
  if (!isAppFile(url) || !/\.tsx?$/.test(url)) {
    return nextLoad(url, context);
  }
  const fileName = fileURLToPath(url);
  const { outputText } = ts.transpileModule(fs.readFileSync(fileName, "utf8"), {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  return { format: "module", source: outputText, shortCircuit: true };
};
