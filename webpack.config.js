const path = require("path");

module.exports = {
  entry: "./src/index.js", // Replace with the path to your entry file
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"), // Replace with the desired output path
  },
  resolve: {
    fallback: {
      worker_threads: false,
      path: require.resolve("path-browserify"),
      timers: require.resolve("timers-browserify"),
      querystring: require.resolve("querystring-es3"),
      console: require.resolve("console-browserify"),
    },
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
    ],
  },
};
