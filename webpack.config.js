const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const webpack = require("webpack");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ["@react-navigation"],
      },
    },
    argv
  );

  // Add an alias for 'crypto' to use 'crypto-browserify'
  config.resolve.alias = {
    ...config.resolve.alias,
    crypto: require.resolve("crypto-browserify"),
    vm: require.resolve("vm-browserify"),
    stream: require.resolve("stream-browserify"),
  };

  // Return the modified config
  return config;
};
