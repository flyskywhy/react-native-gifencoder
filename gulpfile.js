const gulp = require('gulp');
const babel = require('gulp-babel');
//const watch = require('gulp-watch');
const sourcemaps = require('gulp-sourcemaps');
const Builder = require('systemjs-builder');
const fse = require('fs-extra');

function cleanTask(callback) {
  fse.emptyDir('dist', callback);
}

function babelTask() {
  return gulp.src('lib/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/'));
}

function systemjsTask() {
  const builder = new Builder('dist/');

  return builder.buildStatic('export.js', 'dist/jsgif.min.js', {
    'minify': true,
    'sourceMaps': true,
  });
}

const build = gulp.series(
  cleanTask,
  babelTask,
  systemjsTask
);

gulp.task('build', build);

gulp.task('watch', () => {
  gulp.watch('lib/**/*.js', build);
});
