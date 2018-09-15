import path from 'path'
import pug from 'pug'
import sass from 'node-sass'
import {optimize} from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import S3Plugin from 'webpack-s3-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'

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
        ...(IS_PROD ? MiniCssExtractPlugin.loader : 'style-loader'),
        {loader: 'css-loader', options: {importLoaders: 2}},
        'postcss-loader',
        'sass-loader'
      ]
    }, {
      test: /\.pug/,
      include: SRC_PATH,
      loader: 'svelte-loader',
      options: {
        hotReload: IS_DEV,
        preprocess: {
          markup({content, ...rest}) {
            return {code: pug.render(content)}
          },

          style({content, attributes, filename}) {
            return new Promise((resolve, reject) => {
              sass.render({
                data: content,
                includePaths: ['src'],
                sourceMap: true,
                outFile: 'x', // this is necessary, but is ignored
                importer(url, prev) {
                  if (/^~.*/.test(url)) {
                    const filePath = url.replace(/^~/, '')
                    const nodeModulePath = `./node_modules/${filePath}`

                    return {file: path.resolve(nodeModulePath)}
                  } else {
                    const relativeFilePath = filename.replace(new RegExp('[^\\/]+$'), '')

                    console.log(path.resolve(relativeFilePath, url))
                    return {file: path.resolve(relativeFilePath, url)}
                  }
                }
              }, (err, result) => {
                if (err) return reject(err)

                resolve({
                  code: result.css,
                  map: result.map
                })
              })
            })
          }
        }
      }
    }]
  },

  plugins: PLUGINS,

  resolve: {
    mainFields: ['svelte', 'browser', 'module', 'main'],
    modules: [SRC_PATH, rootPath('node_modules')]
  },

  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: IS_PROD,
        uglifyOptions: {
          mangle: true
        }
      }),
      new OptimizeCSSAssetsPlugin({})
    ],

    splitChunks: {
      cacheGroups: !IS_PROD ? false : {
        styles: {
          name: 'styles',
          test: /\.s?css$/,
          chunks: 'all',
          enforce: true
        },

        common: {
          name: 'common',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
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
