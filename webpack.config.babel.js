import path from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import {name as appName} from './package.json'

const rootPath = (nPath) => path.resolve(__dirname, nPath)

const {NODE_ENV = 'development'} = process.env
const IS_PROD = NODE_ENV === 'production'
const IS_TEST = NODE_ENV === 'test'
const IS_DEV = NODE_ENV === 'development'
const SRC_PATH = rootPath('src')
const DIST_PATH = rootPath('dist')

const PLUGINS = []

if (IS_PROD) {
  PLUGINS.push(
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name]-[chunkhash].css'
    })
  )
} else if (!IS_TEST) {
  PLUGINS.push(
    new HtmlWebpackPlugin({
      inject: true,
      title: appName
    })
  )
}

export default {
  entry: './src/main.js',
  mode: IS_PROD ? 'production' : 'development',

  output: {
    path: DIST_PATH,
    filename: IS_PROD ? '[name]-[chunkhash].js' : '[name].js'
  },


  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: SRC_PATH,
      query: {
        sourceMap: !IS_PROD,
        cacheDirectory: true,
        compact: IS_PROD
      }
    }, {
      test: /\.s?css/,
      include: SRC_PATH,
      use: [
        ...(IS_PROD ? [MiniCssExtractPlugin.loader, 'css-loader'] : ['style-loader']),
        'postcss-loader',
        'sass-loader'
      ]
    }, {
      test: /\.pug/,
      include: SRC_PATH,
      use: [{
        loader: 'svelte-loader',
        options: {
          emitCss: true,
          hotReload: IS_DEV,
          preprocess: {
            markup({content, ...rest}) {
              return {code: content}
            }
          }
        }
      }, 'pug-html-loader']
    }]
  },

  plugins: PLUGINS,

  resolve: {
    mainFields: ['svelte', 'browser', 'module', 'main'],
    modules: [SRC_PATH, rootPath('node_modules')]
  },

  devServer: {
    historyApiFallback: true,
    progress: true,
    port: 3000,

    stats: {
      modules: false,
      warnings: true,
      children: false,
      errorDetails: true
    },

    overlay: {
      warnings: false,
      errors: true
    }
  }
}
