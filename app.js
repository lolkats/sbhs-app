GLOBAL.rootDir = __dirname;

var config = require('./config');
var request = require('request');
var express = require('express');
var passport = require('passport');
var path = require('path');
var fs = require('fs');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session  = require('express-session');
var bodyParser = require('body-parser');
var db = require('./lib/db')(config.db);
var models = db.models;

var sbhsAPI = require('./lib/api');
var sbhs = sbhsAPI.Strategy(config.sbhs,models);
var app = express();

passport.serializeUser(function(user,done){return done(null,user)});
passport.deserializeUser(function(user,done){return done(null,user)});

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
        content: {
          max: 0, // how much memory to use on caching contents
          maxAge: 0, // how long to cache contents for
                                  // if `false` does not set cache control headers
          cacheControl: 'no-cache' // to set an explicit cache-control
        },
         cache: false
    }));
    app.set('view engine', 'dust');
    app.engine('dust', require('adaro').dust({cache: false}));
}
// view engine setup
var sessionStore = session({
  secret:config.session.secret,
  cookie: {maxAge:1000*60*60*24*14},
//  store: new(require('express-sessions'))({
//    storage:'mongodb',
//    instance:db.db,
//    collection:'sessions'
// })  
});
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(sessionStore);
app.use(passport.initialize());
app.use(passport.session());
passport.use(sbhs);
app.use(function(req,res,next){
    req.sbhsAPI = sbhs;
    req.getTokens = function(done) {
      var self = this;
      var tokens = this.user.tokens;
        if (new Date().valueOf() < this.user.tokens.expires) {
            done(null, tokens);
        } else {

        request.post({
            url: 'https://student.sbhs.net.au/api/token',
            form: {
              refresh_token: tokens.refreshToken,
              client_id: config.sbhs.clientID,
              client_secret: config.sbhs.clientSecret,
              grant_type:'refresh_token'
          }

      }, function (err, response, body) {
        if(err) return done(err);


        var result = JSON.parse(body);
        models.User.find({user:self.user.username},function(err,db){
          db.accessToken = result.access_token;
          db.save(function(){});
        });
        var now = new Date();
        var newTokens = {accessToken: result.access_token, refreshToken: tokens.refreshToken, expires: (new Date(now.getTime() + (result.expires_in * 1000))).valueOf()};
        self.user.tokens = newTokens;

            return done(null, newTokens);

        });



      }
    };
    if(req.user){
      res.locals.authenticated = true;
    }
    next();
});


app.Router = express.Router;
var router = app.Router();
router.Router = app.Router;
//Require Routers
fs.readdirSync(rootDir+'/routes/').forEach(function(file) {
    fs.stat(rootDir+'/routes/'+file,function(err,stat){
        if(stat.isDirectory()){
            require("./routes/"+file)(router,models);
        }

    });
});
app.use('/',router);

app.get('/login', passport.authenticate('sbhs'));

app.get('/login/callback', passport.authenticate('sbhs', {
    successRedirect: '/',
    failureRedirect: '/fail'
}));

app.get('/logout',function(req,res){
    req.logout();
    res.redirect('/');
});
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
