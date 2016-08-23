'use strict';

var path = require('path');
var webpack = require('webpack');

var appSettings = path.join(__dirname, 'src/js/settings/settings-staging.js');

module.exports = {
	devtool: '#inline-source-map',
	entry: {
		staging: [
			'whatwg-fetch', 
			'babel-polyfill', 
			'./src/js/index'
		],
	},
	output: {
		path: path.join(__dirname, '/production/assets/js'),
		filename: '[name].js',
		publicPath: path.join(__dirname, '/production/assets/js'),
		pathinfo: true
	},

	resolve: {
		modulesDirectories: ['node_modules'],
		extentions: ['', '.js'],
		alias: {
			appSettings: appSettings,
		}
	},

	module: {
		noParse: [
		],
		loaders: [
			{   test: /\.js$/, 
				loader: 'babel',
				include: [
					path.join(__dirname, '/src/js'),
				], 
				query: {
					cacheDirectory: true,
					presets: ['es2015', 'stage-2']
				}
			},
		]
	},
	plugins: [     
	]
};

