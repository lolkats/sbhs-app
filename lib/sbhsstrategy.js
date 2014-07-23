var util           = require('util'),
OAuth2Strategy = require('passport-oauth2'),
https = require('https');

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://student.sbhs.net.au/api/authorize';
  options.tokenURL = options.tokenURL || 'https://student.sbhs.net.au/api/token';
  options.scopeSeparator = options.scopeSeparator || ' ';
  options.scope = options.scope || 'all-ro';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'sbhs';
}


util.inherits(Strategy, OAuth2Strategy);

// Basic Functions

Strategy.prototype.getJSONResource = function(accessToken, resourcePath, done) {
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

Strategy.prototype.userProfile = function(accessToken, done) {
  this.getJSONResource(accessToken, 'https://student.sbhs.net.au/api/details/userinfo.json', done);
};

Strategy.prototype.awardScheme = function(accessToken, done) {
  this.getJSONResource(accessToken, 'https://student.sbhs.net.au/api/details/participation.json', done);
};

Strategy.prototype.timetable = function(accessToken, done) {
  this.getJSONResource(accessToken, 'https://student.sbhs.net.au/api/timetable/timetable.json', done);
};

// Date Parameter is in format YYYY-MM-DD
Strategy.prototype.day = function(accessToken, done, date) {
  var resourcePath = 'https://student.sbhs.net.au/api/timetable/daytimetable.json';
  if (date) { resourcePath += '?date=' + date }
    this.getJSONResource(accessToken, resourcePath, done);
};

// Date Parameter is in format YYYY-MM-DD
Strategy.prototype.dailyNotices = function(accessToken, done, date) {
  var resourcePath = 'https://student.sbhs.net.au/api/dailynews/list.json';
  if (date) { resourcePath += '?date=' + date }
    this.getJSONResource(accessToken, resourcePath, done);
};

exports = module.exports = Strategy;