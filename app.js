GLOBAL.rootDir = __dirname;

var config = require('./config');
var express = require('express');
var passport = require('passport');
var path = require('path');
var fs = require('fs');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session  = require('express-session');
var bodyParser = require('body-parser');

var sbhsAPI = require('./lib/api');
var sbhs = sbhsAPI.Strategy(config.sbhs);
var app = express();

passport.serializeUser(function(user,done){done(null,user)});
passport.deserializeUser(function(user,done){done(null,user)});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session(config.session));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

passport.use(sbhs);

app.Router = express.Router;
var router = app.Router();
router.Router = app.Router;
//Require Routers
fs.readdirSync(rootDir+'/routes/').forEach(function(file) {
    fs.stat(rootDir+'/routes/'+file,function(err,stat){
        if(stat.isDirectory()){
            require("./routes/"+file)(router,{},sbhs);
        }

    });
});
app.use('/',router);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
