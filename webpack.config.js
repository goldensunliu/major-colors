const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: "commonjs2",
        filename: 'lib.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          // exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [require('@babel/preset-env')],
              plugins: [require('@babel/plugin-proposal-object-rest-spread'), "transform-class-properties"]
            }
          }
        }
      ]
    },
    stats: {
        colors: true
    },
    target: "node",
    devtool: 'source-map'
};