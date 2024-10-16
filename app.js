const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors())
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/api', require('./routes'));

if (!fs.existsSync('media/profile_images')){
  fs.mkdirSync('media/profile_images')
}

if (!fs.existsSync('media/post_images')){
  fs.mkdirSync('media/post_images')
}

if (!fs.existsSync('media/default_images')){
  fs.mkdirSync('media/default_images')
}
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
