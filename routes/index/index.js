module.exports = function(router){
/* GET home page. */
	router.get('/', function(req, res) {
		if(req.user){
			res.render('index');
		}
		else{
			res.render('login')
		}
	});
};
