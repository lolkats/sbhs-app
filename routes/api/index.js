var request = require('request');
var apiCache = {};
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function yyyymmdd(dateIn) {
   var yyyy = dateIn.getFullYear();
   var mm = pad(dateIn.getMonth()+1,2); // getMonth() is zero-based
   var dd  = pad(dateIn.getDate(),2);
   return String(yyyy +"-"+ mm + "-"+dd); // Leading zeros for mm and dd
}

function updateApiCache(){
	var y = (new Date()).getFullYear();
	var m = (new Date().getMonth+1);
	var eod = (new Date()).setHours(15,15,0,0);
	// Calendar
	request("https://student.sbhs.net.au/api/calendar/days.json?from="+y+"-01-01&to="+y+"-12-31",function(err,response,body){
		if(err || response.statusCode != 200){
			console.log(err);
			return;
		}
		else{
			cal = JSON.parse(body);
			apiCache.calendar = cal;
			// Calculate yyyymmdd

			apiCache.updatedAt = (new Date()).getTime();
			apiCache.updatedYear = (new Date()).getFullYear();
		}
	});
	// Calendar next year
	request("https://student.sbhs.net.au/api/calendar/days.json?from="+(y+1)+"-01-01&to="+(y+1)+"-12-31",function(err,response,body){
		if(err || response.statusCode != 200){
			console.log(err);
			return;
		}
		else{
			cal = JSON.parse(body);
			apiCache.calendarNextYear = cal;
			// Calculate yyyymmdd

			apiCache.updatedAt = (new Date()).getTime();
			apiCache.updatedYear = (new Date()).getFullYear();
		}
	});


};
updateApiCache();
// 24 hour update
setInterval(updateApiCache,1000*60*60*24);
module.exports = function(app,models){
	var router = app.Router();
	router.get("/daytimetable",function(req,res){
		var date;
		if(req.user){
			req.getTokens(function(err,token){
				req.sbhsAPI.day(req.user.tokens.accessToken,function(err,o){
	                if (!err && o) {
	                    res.json(o);
	                } else {
	                    res.status(500).send(err);
	                }
				},req.query.date);
			});
		}
		else{
			res.json({status:false,reason:"access_denied"},401);
		}
	});
	router.get("/dailynotices",function(req,res){
		var date;
		if(req.user){
			req.getTokens(function(err,token){
				req.sbhsAPI.dailyNotices(req.user.tokens.accessToken,function(err,o){
	                if (!err && o) {
	                    res.json(o);
	                } else {
	                    res.status(500).send(err);
	                }
				},req.query.date);
			});
		}
		else{
			res.json({status:false,reason:"access_denied"},401);
		}
	});
	router.get("/timetable",function(req,res){
		var date;
		if(req.user){
			req.getTokens(function(err,token){
				req.sbhsAPI.timetable(req.user.tokens.accessToken,function(err,o){
	                if (!err && o) {
	                    res.json(o);
	                } else {
	                    res.status(500).send(err);
	                }
				});
			});
		}
		else{
			res.json({status:false,reason:"access_denied"},401);
		}
	});	
	router.get("/calendaryear",function(req,res){
		if(apiCache.updatedYear != new Date().getFullYear()){
			updateApiCache();
			res.json({err:true,reason:"reload"});
		}
		else if(!apiCache.calendar){
			updateApiCache();
			res.json({err:true,reason:"reload"});
		}
		else{
			res.json(apiCache.calendar);
		}
		
	});
	router.get("/calendarnextyear",function(req,res){
		if(apiCache.updatedYear != new Date().getFullYear()){
			updateApiCache();
			res.json({err:true,reason:"reload"});
		}
		else if(!apiCache.calendarNextYear){
			updateApiCache();
			res.json({err:true,reason:"reload"});
		}
		else{
			res.json(apiCache.calendarNextYear);
		}
	});
	app.use("/api",router);
};