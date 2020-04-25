const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  output: {
    path: path.join(__dirname, '../build'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css', '.scss']
  },
  performance: {
    hints: false
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        awsSdk: {
          test: /[\\/]node_modules[\\/]((aws-sdk).*)[\\/]/,
          name: 'aws-sdk',
          chunks: 'all'
        },
        vendors: {
          test: /[\\/]node_modules[\\/]((?!aws-sdk).*)[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: isDev
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('autoprefixer')
              ]
            }
          },
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  plugins: [
    new CompressionPlugin({
      test: /\.js(\?.*)?$/i,
      algorithm: 'gzip',
    }),
    new MiniCssExtractPlugin({
      filename: isDev ? '[name].css' : '[name].[hash].css',
      chunkFilename: isDev ? '[id].css' : '[id].[hash].css'
    })
  ]
}