module.exports = function(router){
/* GET home page. */
	router.get('/', function(req, res) {
	  res.render('index', { title: 'Express' });
	});
};
