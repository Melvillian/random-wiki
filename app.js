var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var upload = multer();
var logger = require('morgan');
var favicon = require('serve-favicon');

// setup postgres and attach to server global object for later use
const postgres = require('postgres');
const postgresConnectionStr = process.env.PG_CONN_STR
  || 'postgres://melvillian:password@localhost:5432/melville_wiki';
const sql = postgres(postgresConnectionStr)
process.global = { sql };

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use('/', indexRouter);

// for parsing multipart/form-data
app.use(upload.array());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
