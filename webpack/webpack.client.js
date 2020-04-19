const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const isDev = process.env.NODE_ENV !== 'production';
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
      path.join(__dirname, '../public/_redirects'),
    ]),
  ],
})

if (isDev) {
  config.devServer = {
    host: '0.0.0.0',
    port: '8888',
    open: true,
    hot: true,
    overlay: {
      errors: true
    },
    historyApiFallback: {
      index: '/'
    },
    before: function (app, server, compiler) {
      app.get('*.js', function (req, res, next) {
        req.url = req.url + '.gz';
        res.set('Content-Encoding', 'gzip');
        res.set('Content-Type', 'text/javascript');
        next();
      });
    }
  }
  config.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerPort: 8081,
      openAnalyzer: true
    }),
    new webpack.SourceMapDevToolPlugin()
  )
}

module.exports = config;
