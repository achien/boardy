const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = [
  {
    entry: './src/main.ts',
    target: 'electron-main',
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.(ts|js)x?$/,
          use: 'eslint-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
    },
  },
  {
    entry: './src/app.tsx',
    target: 'electron-renderer',
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.(ts|js)x?$/,
          use: 'eslint-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: true,
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: 'file-loader',
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({
        filename: 'app.html',
        title: 'Boardy',
      }),
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    output: {
      filename: 'app.js',
      path: path.resolve(__dirname, 'dist'),
    },
  },
];
