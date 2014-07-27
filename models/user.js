module.exports = function(mongoose,models){
  var User = mongoose.Schema({
    user:String,
    accessToken:String,
    accessTokenExpires:Number,
    refreshToken:String,
//    givenName:String,
//    familyName:String,
    yearGroup:String
  });
  models.register('User',User);
};
