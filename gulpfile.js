const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('browserify');
const babelify = require('babelify');
const fse = require('fs-extra');
const babel = require('gulp-babel');

function cleanCommonJs(callback) {
  fse.emptyDir('./dist/commonjs/', callback);
}

function cleanBundle(callback) {
  fse.emptyDir('./dist/bundle/', callback);
}

function buildCommonJs() {
  return gulp.src([
      './src/**/*.js',
      '!./src/bundle.js',
    ])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/commonjs/'));
}

function buildBundle() {
  const b = browserify({
    'entries': './src/bundle.js',
    'debug': true,
    'transform': [babelify]
  });

  return b.bundle()
    .pipe(source('GifEncoder.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/bundle/'));
}

const buildCommonJsTask = gulp.series(
  cleanCommonJs,
  buildCommonJs
);

const buildBundleTask = gulp.series(
  cleanBundle,
  buildBundle
);

gulp.task('build', gulp.parallel(
  buildCommonJsTask,
  buildBundleTask
));

gulp.task('watch', () => {
  gulp.watch('./src/**/*.js', buildBundleTask);
});
