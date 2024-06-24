// tsconfig-paths-bootstrap.js
const tsConfigPaths = require("tsconfig-paths");

const baseUrl = "./"; // Base directory containing your tsconfig.json
const { paths } = require("./tsconfig.json").compilerOptions;

tsConfigPaths.register({
  baseUrl,
  paths,
});
