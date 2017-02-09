'use strict';

var gulp = require('gulp');
var compass = require('gulp-compass');

gulp.task('sass', function () {
    return gulp.src(['./sass/**/*.scss'])
        .pipe(compass({
            config_file: 'config.rb',
            css: 'public/css',
            sass: 'sass'
        }))
        .pipe(gulp.dest('./public/css'));
});

gulp.task('default', function () {
    gulp.watch('./sass/**/*.scss', ['sass']);
});