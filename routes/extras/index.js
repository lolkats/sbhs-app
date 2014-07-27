module.exports = function(app,models){
	var router = app.Router();
	router.get('/',function(req,res){
		if(req.user){
			res.render('extras');
		}
		else{
			res.send("Access Denied",401);
		}
	});
	app.use('/extras',router);
};