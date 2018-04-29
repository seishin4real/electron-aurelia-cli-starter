const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const project = require('./aurelia_project/aurelia.json');
const { AureliaPlugin, ModuleDependenciesPlugin } = require('aurelia-webpack-plugin');
const { ProvidePlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// config helpers:
const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
const when = (condition, config, negativeConfig) => condition ? ensureArray(config) : ensureArray(negativeConfig);

// primary config:
const title = 'Electron-Aurelia-cli Starter';
const outDir = path.resolve(__dirname, project.platform.output);
const srcDir = path.resolve(__dirname, 'src');
const nodeModulesDir = path.resolve(__dirname, 'node_modules');
const baseUrl = 'dist/';

const cssRules = [
  { loader: 'css-loader' },
];

module.exports = ({ production, server, extractCss, coverage, analyze } = {}) => ({
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [srcDir, 'node_modules'],
  },
  entry: {
    app: ['aurelia-bootstrapper'],
    vendor: ['bluebird'],
  },
  mode: production ? 'production' : 'development',
  output: {
    path: outDir,
    publicPath: baseUrl,
    filename: production ? '[name].[chunkhash].bundle.js' : '[name].[hash].bundle.js',
    sourceMapFilename: production ? '[name].[chunkhash].bundle.map' : '[name].[hash].bundle.map',
    chunkFilename: production ? '[name].[chunkhash].chunk.js' : '[name].[hash].chunk.js'
  },
  plugins: [
    new AureliaPlugin(),
    new ProvidePlugin({ 'Promise': 'bluebird' }),
    new ModuleDependenciesPlugin({ 'aurelia-testing': ['./compile-spy', './view-spy'] }),
    new HtmlWebpackPlugin({
      template: 'index.ejs',
      filename: "../index.html",
      metadata: { title, server, baseUrl }
    }),
    new CopyWebpackPlugin([{ from: 'static/favicon.ico', to: 'favicon.ico' }]),
    ...when(extractCss, [new ExtractTextPlugin({ filename: `[name].[${production ? 'chunkhash' : 'hash'}].bundle.css`, allChunks: true })]),
    ...when(analyze, new BundleAnalyzerPlugin())
  ],
  target: 'electron-renderer',
  performance: { hints: false },
  devServer: {
    contentBase: outDir,
    // serve index.html for all 404 (required for push-state)
    historyApiFallback: true
  },
  devtool: production ? 'nosources-source-map' : 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: extractCss
          ? ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader?minimize' })
          : ['style-loader', 'css-loader'],
      },
      {
        test: /\.sass$/,
        use: extractCss
          ? ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader?minimize', 'sass-loader'] })
          : ['style-loader', 'css-loader', 'sass-loader']
      },
      { test: /\.html$/i, loader: 'html-loader' },
      { test: /\.tsx?$/, exclude: /node_modules/, loader: 'ts-loader' },
      { test: /\.json$/i, loader: 'json-loader' },
      // use Bluebird as the global Promise implementation:
      { test: /[\/\\]node_modules[\/\\]bluebird[\/\\].+\.js$/, loader: 'expose-loader?Promise' },
      // embed small images and fonts as Data Urls and larger ones as files:
      { test: /\.(png|gif|jpg|cur)$/i, loader: 'url-loader?limit=8192'  },
      { test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/i, loader: 'url-loader?limit=10000&mimetype=application/font-woff2' },
      { test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/i, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      // load these fonts normally, as files:
      { test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/i, loader: 'file-loader' },
      ...when(coverage, {
        test: /\.[jt]s$/i, loader: 'istanbul-instrumenter-loader',
        include: srcDir, exclude: [/\.{spec,test}\.[jt]s$/i],
        enforce: 'post', options: { esModules: true },
      })
    ]
  }
});
