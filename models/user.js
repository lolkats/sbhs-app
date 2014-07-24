module.exports = function(mongoose,models){
  var User = mongoose.Schema({
    user:String,
    accessToken:String,
    refreshToken:String,
    givenName:String,
    familyName:String
  });
  models.register('User',User);
};
