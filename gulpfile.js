'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')(); //lazy load some of gulp plugins

var fs = require('fs');
var watch = require('gulp-watch');
var spritesmith = require('gulp.spritesmith');
var posthtml = require('gulp-posthtml');

var devMode = process.env.NODE_ENV || 'development';

var destFolder = devMode === 'development' ? 'dev' : 'production';

var packageJson = JSON.parse(fs.readFileSync('./package.json'));

var CDN = packageJson.cdn;

if (!CDN){
	console.error('SET THE CDN!!!');
}

// STYLES
gulp.task('sass', function () {

	return gulp.src('src/sass/style.scss')
		.pipe($.if(devMode !== 'production', $.sourcemaps.init())) 
		.pipe($.sass({outputStyle: 'expanded'})) 
		.on('error', $.notify.onError())
		.pipe($.autoprefixer({
			browsers: ['> 1%'],
			cascade: false
		}))
		.pipe($.cssImageDimensions())
		.pipe($.if(devMode !== 'production', $.sourcemaps.write())) 
		.pipe(gulp.dest(destFolder + '/assets/css'));  
});

// image urls
gulp.task('modifyCssUrls', function () {
	fs = require('fs');
	$.revHash = require('rev-hash');

	return gulp.src(destFolder + '/assets/css/style.css')
		.pipe($.modifyCssUrls({
			modify: function (url, filePath) {
				var buffer = fs.readFileSync(url.replace('../', destFolder + '/assets/'));				
				return url + '?_v=' + $.revHash(buffer);
			},
		}))		
		.pipe($.minifyCss({compatibility: 'ie8'}))
		.pipe(gulp.dest(destFolder + '/assets/css'));

});

// ASSETS
gulp.task('assets-files', function(){
	return gulp.src(['src/assets/**/*.*', '!src/assets/sprite/*.*', '!src/assets/favicon.ico'], {since: gulp.lastRun('assets-files')})
		.pipe($.newer(destFolder + '/assets'))
		.pipe(gulp.dest(destFolder + '/assets'))
});
gulp.task('assets-favicon', function(){
	return gulp.src('src/assets/favicon.ico', {since: gulp.lastRun('assets-favicon')})
		.pipe($.newer(destFolder))
		.pipe(gulp.dest(destFolder))
});
gulp.task('sprite', function(callback) {

	var spriteData = 
		gulp.src('src/assets/sprite/*.png') // путь, откуда берем картинки для спрайта
		.pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: '_sprites.scss',
			imgPath: '../images/sprite.png'
		}))
		.on('error', $.notify.onError())
		

	spriteData.img
		.pipe(gulp.dest(destFolder + '/assets/images/'))

	spriteData.css.pipe(gulp.dest('src/sass/'));

	callback();
});
gulp.task('assets', gulp.parallel('assets-files', 'assets-favicon', 'sprite'));


// HTML
gulp.task('html', function(callback){

	function html(folder) {

		var newDestFolder = destFolder + (folder !== 'local' ? '/' + folder : '');

		var files = [
			'src/html/*.html', 
			'!src/html/_*.html', 
		];

		if (folder !== 'local'){
			files.push('!src/html/oauth.html');
		}

		return gulp.src(files)
			.pipe($.fileInclude({
				prefix: '@@',
				basepath: '@file',
				context: {
					'server': folder
				},
				indent: true
			}))
			.on('error', $.notify.onError())
			.pipe($.if(devMode === 'production', $.htmlmin({collapseWhitespace: true})))
			.pipe(gulp.dest(newDestFolder));
	}
	
	if (devMode == 'development'){
		html('local');
	}else{
		html('mosreg');
		html('dnevnik');
		html('staging');
	}

	setTimeout( ()=> { //to let write files
		callback();
	},300);

});

//set new images,css and js hash versions
gulp.task('vers', function(){	

	$.revHash = require('rev-hash');

	const plugins = [
		function relativeLinks(tree) {
			tree.match({ tag: 'a' }, function (node) {
				const href = node.attrs && node.attrs['href'] ? node.attrs['href'] : false;
				
				//if no href or it is external
				if (!href || href.indexOf('http') === 0){
					return node;
				}

				if (href.indexOf('.html') === href.length - 5){
					node.attrs['href'] =  href.replace('.html', '');
				}else if (href.indexOf('assets/') === 0){
					node.attrs['href'] =  href.replace('assets/', CDN);
				}				

				return node;
			})
		},
		function imgVers(tree) {
			tree.match({ tag: 'img' }, function (node) {
				return setVestion(node, 'src');
			})
		},
		function cssVers(tree) {
			tree.match({ tag: 'link' }, function (node) {
				return setVestion(node, 'href');
			})
		},
		function jsVers(tree) {
			tree.match({ tag: 'script' }, function (node) {
				return setVestion(node, 'src');
			})
		},
	];

	function getVersion(file){
		return fs.existsSync(destFolder + '/' + file) && $.revHash(fs.readFileSync(destFolder + '/' +  file));
	}

	function setVestion(node, attrName){
		const attr = node.attrs && node.attrs[attrName] ? node.attrs[attrName] : false;
		
		if (!attr || attr.indexOf('assets') !== 0){
			return node;
		}
		
		const version =  getVersion(attr);

		if (!version){
			return node;
		}

		node.attrs[attrName]=  attr.replace('assets/', CDN) + '?_v=' + version;
		return node;
	}

	return gulp.src([destFolder + '/*/*.html'])
		.pipe(posthtml(plugins))
		.on('error', $.notify.onError())
		.pipe(gulp.dest(destFolder));

});

//JS
gulp.task('webpack', function(callback) {
	$.webpack = require('webpack');
	$.webpackConfig = require('./webpack.config.js');
	
	var myConfig = Object.create($.webpackConfig);

	$.webpack(myConfig, 
	function(err, stats) {
		if(err) throw new $.util.PluginError('webpack', err);
		$.util.log('[webpack]', stats.toString({
			// output options
		}));
		callback();
	});
});

// BUILD
gulp.task('server', function () {
	$.server = require('gulp-server-livereload');

	gulp.src(destFolder)
	.pipe($.server({
		livereload: true,
		directoryListing: false,
		open: false,
		port: 9000
	}));

	gulp.watch('src/sass/**/*.scss', gulp.series('sass'));
	gulp.watch('src/assets/**/*', gulp.series('assets'));
	gulp.watch('src/html/**/*.html', gulp.series('html'));
	gulp.watch('src/js/**/*.js', gulp.series('webpack'));

});


gulp.task('clean', function(callback) {
	$.del = require('del');
	return $.del([destFolder]);
});

gulp.task('build', gulp.series('webpack', 'assets', 'sass', 'html'));


//PUBLIC TASKS

//production

// npm run prod - build whole project to deploy in 'production' folder
gulp.task('prod-no-js', gulp.series('assets', 'sass', 'html', 'modifyCssUrls', 'vers'));

// npm run prod-html - build only html in 'production' folder
gulp.task('prod-html', gulp.series('html', 'vers'));

// npm run prod-css - build only css in 'production' folder
gulp.task('prod-css', gulp.series('sass', 'modifyCssUrls'));

//development

// run prod and hot-reload servers
gulp.task('servers', gulp.parallel('server'));

// gulp start - very first start to build the project and run server in 'dev' folder
gulp.task('start', gulp.series('clean', 'build', 'servers'));

// gulp - just run server in 'dev' folder
gulp.task('default', gulp.parallel('servers'));



