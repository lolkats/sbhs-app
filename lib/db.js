var mongoose = require('mongoose');
var timeStamps = require('mongoose-timestamps');
module.exports = function(address){
  var db = mongoose;
  var models = {};
  models.register=function(name,schema){
    if(name=="register"){throw Error("Name Cannot Be register")}
    schema.plugin(timeStamps);
    models[name]=mongoose.model(name,schema);
  }
  db.connect(address);
  require('fs').readdirSync(rootDir+'/models/').forEach(function(file) {
    if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
      var name = file.replace('.js', '');
      require("../models/"+name)(db,models);
    }
  });	
  return({db:db, models:models});
};
