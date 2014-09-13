var UUID = require('node-uuid');
var util = require('util');
var OAuth2Strategy = require('passport-oauth2');
var https = require('https');
exports.Strategy = function(conf,models){
	var SBHS = new SBHSStrategy({
		name:'sbhs',
	    clientID: conf.clientID,
	    clientSecret: conf.clientSecret,
	    state: UUID.v4(),
	    callbackURL: 'http://'+conf.host+'/login/callback'
	},
	function(accessToken, refreshToken, profile, done) {
	    var now = new Date();
		// profile.user, profile.givenName, profile.surname
		models.User.findOne({user:profile.username},function(err,db){
                  if(!db){
                    var user = new models.User({
                      user:profile.username,
                      accessToken:accessToken,
                      accessTokenExpires:(new Date(now.getTime() + 3600000)).valueOf(),
                      refreshToken:refreshToken,
                      yearGroup:profile.yearGroup,
                        //givenName: profile.givenName,
                        //familyName: profile.surname
                    })
                    user.save(function(){
                    });
                  }
                  else{
                    db.accessToken = accessToken;
                    db.refreshToken = refreshToken;
                    db.save(function(){
                    });
                  }
                })    
	        profile.tokens = {accessToken: accessToken, refreshToken: refreshToken, expires: (new Date(now.getTime() + 3600000)).valueOf()};
	        return done(null,profile);
	    });
	return SBHS;
};

function SBHSStrategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://student.sbhs.net.au/api/authorize';
  options.tokenURL = options.tokenURL || 'https://student.sbhs.net.au/api/token';
  options.scopeSeparator = options.scopeSeparator || ' ';
  options.scope = options.scope || 'all-ro';

  OAuth2Strategy.call(this, options, verify);
  this.name = options.name || 'sbhs';
}


util.inherits(SBHSStrategy, OAuth2Strategy);

// Basic Functions

SBHSStrategy.prototype.getJSONResource = function(accessToken, resourcePath, done) {
  var profile = { provider: this.name };
  this._oauth2.getProtectedResource(resourcePath, accessToken, 
    function (err, body, res) {
      if (err) { return done(err); }
      try {
        o = JSON.parse(body);
        done(null, o);
      } catch(e) { done(e); }
    }
    );
}

SBHSStrategy.prototype.userProfile = function(accessToken, done) {
  this.getJSONResource(accessToken, 'https://student.sbhs.net.au/api/details/userinfo.json', done);
};

SBHSStrategy.prototype.awardScheme = function(accessToken, done) {
  this.getJSONResource(accessToken, 'https://student.sbhs.net.au/api/details/participation.json', done);
};

SBHSStrategy.prototype.timetable = function(accessToken, done) {
  this.getJSONResource(accessToken, 'https://student.sbhs.net.au/api/timetable/timetable.json', done);
};

// Date Parameter is in format YYYY-MM-DD
SBHSStrategy.prototype.day = function(accessToken, done, date) {
  var resourcePath = 'https://student.sbhs.net.au/api/timetable/daytimetable.json';
  if (date) { resourcePath += '?date=' + date }
    this.getJSONResource(accessToken, resourcePath, done);
};

// Date Parameter is in format YYYY-MM-DD
SBHSStrategy.prototype.dailyNotices = function(accessToken, done, date) {
  var resourcePath = 'https://student.sbhs.net.au/api/dailynews/list.json';
  if (date) { resourcePath += '?date=' + date }
    this.getJSONResource(accessToken, resourcePath, done);
};
