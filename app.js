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

var models = require('./lib/db')(config.db).models;
var sbhsAPI = require('./lib/api');
var sbhs = sbhsAPI.Strategy(config.sbhs);
var app = express();

passport.serializeUser(function(user,done){done(null,user)});
passport.deserializeUser(function(user,done){done(null,user)});

app.set('views', path.join(__dirname, 'views'));


if (app.get('env') === 'production') {
    app.use(require('st')({ path: __dirname + '/public',
         url: '/static', 
         index: false,
         cache: {
            fd: {
                max: 1000,
                maxAge: 1000*60*60,
            },
            stat: {
                max: 5000,
                maxAge: 1000*60
            },
            content: {
                max: 1024*1024*64,
                maxAge: 1000*60*10,
                cacheControl: 'public, max-age=600'
            }
         }
    }));
    app.set('view engine', 'js');
    app.engine('js', require('adaro').js({cache: true}));
}
if (app.get('env') === 'development'){
    app.use(require('st')({ path: __dirname + '/public',
         url: '/static', 
         index: false,
         cache: false
    }));
    app.use(function(req,res,next){
        res.locals.development = true;
        next();
    });
    app.set('view engine', 'dust');
    app.engine('dust', require('adaro').dust({cache: false}));
}
// view engine setup

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session(config.session));
app.use(passport.initialize());
app.use(passport.session());

passport.use(sbhs);

app.Router = express.Router;
var router = app.Router();
router.Router = app.Router;
//Require Routers
fs.readdirSync(rootDir+'/routes/').forEach(function(file) {
    fs.stat(rootDir+'/routes/'+file,function(err,stat){
        if(stat.isDirectory()){
            require("./routes/"+file)(router,models,sbhs);
        }

    });
});
app.use('/',router);

app.get('/login', passport.authenticate('sbhs'));

app.get('/login/callback', passport.authenticate('sbhs', {
    successRedirect: '/',
    failureRedirect: '/'
}));

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
