#!/usr/bin/env node
var debug = require('debug')('my-application');
var app = require('./app');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set('ip',process.env.OPENSHIFT_NODEJS_IP||"0.0.0.0");
var server = app.listen(app.get('port'), app.get('ip'), function() {
  console.log('Express server listening on port ' + server.address().port);
});
