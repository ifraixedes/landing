'use strict';

import fs from 'fs';
import { join } from 'path';
import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import pkg from './package.json';
import autoprefixer from 'autoprefixer';
import cssmqpacker from 'css-mqpacker';
import pcssnext from 'postcss-cssnext';
import pimport from 'postcss-import';

////////////// OPTIONS //////////////
const AUTOPREFIXER = {
  browsers: [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ]
};

const MINIFY_CSS = {
  advanced: false // I've detected that breaks things with purecss
};

const UNCSS = {};

const HTML_MINIFIER = {
  removeComments: true,
  removeCommentsFromCDATA: true,
  removeCDATASectionsFromCDATA: true,
  collapseWhitespace: true,
  conservativeCollapse: false,
  preserveLineBreaks: false,
  collapseBooleanAttributes: true,
  removeAttributesQuotes: true,
  removeRedundantAttributes: true,
  preventAttributesEscaping: true,
  useShortDoctype: false,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeOptionalTags: true,
  removeIgnored: true,
  removeEmptyElements: false,
  lint: true,
  keepClosingSlash: false,
  caseSensitive: false,
  minifyJS: true,
  minifyCSS: true,
  minifyURLs: false
};

//////////////////////////////////


const $ = gulpLoadPlugins();
const reload = browserSync.reload;

// Lint JavaScript
gulp.task('lintjs', () =>
  gulp.src('app/scripts/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failOnError()))
);

// Optimize images
gulp.task('images', () =>
  gulp.src('app/img/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/img'))
    .pipe($.size({title: 'images'}))
);

// Copy all files at the root level (app)
gulp.task('copy-extra-files', () =>
  gulp.src([
    'app/**/*',
    '!app/{styles,styles/**,img,img/**,scripts,scripts/**,*.html}'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'extra files'}))
);

// Compile CSS with postcss
gulp.task('styles', () => {
  let processors = [
    pimport(),
    pcssnext(AUTOPREFIXER),
    cssmqpacker()
  ];
  let uncssOpts = Object.assign({}, UNCSS, {
    html: ['dist/**/*.html']
  });

  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    'app/styles/main.css'
  ])
  .pipe(process.env.FM_ENV === 'dev' ? $.sourcemaps.init() : $.util.noop())
  .pipe($.postcss(processors))
  .pipe($.uncss(uncssOpts))
  .pipe($.minifyCss(MINIFY_CSS))
  .pipe($.size({title: 'styles'}))
  .pipe(process.env.FM_ENV === 'dev' ? $.sourcemaps.write('./') : $.util.noop())
  .pipe(gulp.dest('dist/styles'));
});

// We don't want sass this is left just in case that we need to compile something at some point
//gulp.task('sass', () => {
//  // sass is only to be able to use external libraries,
//  // so we don't want to have source maps for debugging purpose
//  return gulp.src([
//    'app/styles/**/*.scss'
//  ])
//  .pipe($.newer('.tmp/styles'))
//  .pipe($.sass({
//    precision: 10
//  }).on('error', $.sass.logError))
//  .pipe($.autoprefixer(AUTOPREFIXER.browsers))
//  .pipe(gulp.dest('.tmp/styles'));
//});

gulp.task('scripts', () => {
  gulp.src(['./app/scripts/**/*.js'])
  .pipe($.newer('./dist/scripts'))
  .pipe(process.env.FM_ENV === 'dev' ? $.sourcemaps.init() : $.util.noop())
  .pipe($.babel())
  .pipe($.concat('main.js'))
  .pipe($.uglify({ preserveComments: 'some' }))
  .pipe($.size({ title: 'scripts' }))
  .pipe(process.env.FM_ENV === 'dev' ? $.sourcemaps.write('./') : $.util.noop())
  .pipe(gulp.dest('dist/scripts'));
});

// Scan your HTML for assets & optimize them
gulp.task('html', () => {
  return gulp.src('app/**/*.html')
    // Minify any HTML
    .pipe($.htmlMinifier(HTML_MINIFIER))
    // Output files
    .pipe($.size({title: 'html', showFiles: true}))
    .pipe(gulp.dest('dist'));
});

// Watch files for changes & reload
gulp.task('serve', ['init'], () => {
  browserSync({
    open: false,
    notify: false,
    // Customize the Browsersync console logging prefix
    logPrefix: 'FM',
    // Allow scroll syncing across breakpoints
    //scrollElementMapping: ['main'],
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: ['dist'],
    host: '0.0.0.0',
    port: 3000
  });

  gulp.watch(['app/*', '!app/*.html'], ['copy-extra-files']);
  gulp.watch(['app/**/*.html'], ['html', reload]);
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
  gulp.watch(['app/scripts/**/*.js'], ['scripts', reload]);
  gulp.watch(['app/img/**/*'], ['images', reload]);
});

// Clean output directory
gulp.task('clean', () => del(['.tmp', 'dist/*'], {dot: true}));

gulp.task('init', cb =>
  runSequence(
    'clean',
    'html', //uncss require html in dist folder
    ['lintjs', 'scripts', 'styles', 'images', 'copy-extra-files'],
    cb
  )
);

gulp.task('default', ['init']);

