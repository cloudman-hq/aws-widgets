const path = require('path');

module.exports = {
  stories: ['../src/components/**/*.stories.tsx'],
  addons: ['@storybook/addon-actions', '@storybook/addon-links', '@storybook/addon-knobs/register'],
  webpackFinal: async config => {
    config.resolve.extensions = [...config.resolve.extensions, '.ts', '.tsx'];
    config.resolve.alias = {
      '@assets': path.resolve(__dirname, '../assets')
    };
    config.module.rules.push({
      test: /\.tsx?$/,
      loader: 'ts-loader',
      options: {
        transpileOnly: true
      }
    }, {
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader']
    });
    return config;
  },
};
