var path = require('path');
var webpack = require('webpack');

var appSettings = path.join(__dirname, 'src/js/settings/settings-local.js');

module.exports = {
	devtool: '#inline-source-map',
	entry: {
		local: [
			'whatwg-fetch',
			'./src/js/index'
		],
	},
	output: {
		path: path.join(__dirname, 'dev/assets/js'),
		filename: '[name].js',
		publicPath: path.join(__dirname, 'dev/assets/js')
	},
	plugins: [
	],
	resolve: {
		modulesDirectories: ['node_modules'],
		extentions: ['', '.js'],
		alias: {
			appSettings: appSettings,
		}
	},
	devServer: {
	},
	module: {
		noParse: [
			],
			loaders: [
			{   
				test: /\.js$/, 
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
	}
};
