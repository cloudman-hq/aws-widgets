const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const isDev = process.env.NODE_ENV !== 'production';
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const config = webpackMerge(baseConfig, {
  entry: {
    app: path.join(__dirname, "../src/index.tsx")
  },
  output: {
    filename: '[name].[hash].js'
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: path.join(__dirname, '../src/index.html'),
    }),
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new CopyPlugin([
      path.join(__dirname, '../public/atlassian-connect.json'),
    ]),
  ],
})

if (isDev) {
  config.devServer = {
    host: '0.0.0.0',
    port: '8888',
    hot: true,
    overlay: {
      errors: true
    },
    historyApiFallback: {
      index: '/public/index.html'
    },
  }
  config.plugins.push(new webpack.SourceMapDevToolPlugin())
}

module.exports = config;