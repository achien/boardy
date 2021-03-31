const { merge } = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const jsConfig = {
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // chess.js doesn't export itself correctly if `define` exists
      // https://github.com/jhlywa/chess.js/issues/208#issuecomment-647018698
      {
        test: /chess.js/,
        parser: {
          amd: false,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
};

module.exports = [
  merge(jsConfig, {
    entry: './src/main.ts',
    target: 'electron-main',
    output: {
      filename: 'main.js',
    },
  }),
  merge(jsConfig, {
    entry: './src/app.tsx',
    target: 'electron-renderer',
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]-[local]--[hash:base64:5]',
                },
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/,
          use: 'file-loader',
        },
      ],
    },
    plugins: [
      new ESLintPlugin(),
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({
        filename: 'app.html',
        title: 'Boardy',
      }),
    ],
    output: {
      filename: 'app.js',
    },
  }),
];
