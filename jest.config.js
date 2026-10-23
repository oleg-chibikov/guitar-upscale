module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // midifile-ts ships only ES modules, so Jest compiles it like the app code
  transformIgnorePatterns: ["/node_modules/(?!(\\.pnpm|midifile-ts)/)"],
};
