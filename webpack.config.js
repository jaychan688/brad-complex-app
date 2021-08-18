const path = require('path')
// const webpack = require('webpack')

module.exports = {
	entry: './frontend/main.js',
	output: {
		filename: 'main.bundled.js',
		path: path.resolve(__dirname, 'public'),
	},
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: ['babel-loader'],
			},
		],
	},
}
