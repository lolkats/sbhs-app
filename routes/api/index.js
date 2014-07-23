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
	var m = (new Date()).getMonth+1);
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
			var todayDate = yyyymmdd(new Date());
			function calculateNextDay(){
				if(apiCache.calendar[todayDate].dayNumber == 0){
					todayDate = new Date();
					todayDate.setDate(todayDate.getDate() + 1);
					todayDate = yyyymmdd(todayDate);
					calculateNextDay(todayDate);
				}
				else if(apiCache.calendar[todayDate].dayNumber != 0 && (new Date()).getTime() >= eod && todayDate == yyyymmdd(new Date())){
					todayDate = new Date();
					todayDate.setDate(todayDate.getDate() + 1);
					todayDate = yyyymmdd(todayDate);
					calculateNextDay(todayDate);
				}
			}
			calculateNextDay();
			// Bells
			request("https://student.sbhs.net.au/api/timetable/bells.json?date="+ todayDate,function(err,response,body){
				if(err || response.statusCode != 200){
					console.log(err);
					return;
				}
				else{
					bell = JSON.parse(body);
					apiCache.bells = bell;
				}
			});
			apiCache.updatedAt = (new Date()).getTime();
			apiCache.updatedYear = (new Date()).getFullYear();
		}
	});



};
updateApiCache();
// 30 min update
setInterval(updateApiCache,1000*60*30);
module.exports = function(app,models,api){
	var router = app.Router();
	router.get("/daytimetable",function(req,res){

	});
	router.get("/bells",function(req,res){
		if(apiCache.updatedAt < (new Date()).setHours(15,15,0,0) && (new Date()).getTime() >= (new Date()).setHours(15,15,0,0)){
			updateApiCache();
			res.json({err:true,action:"reload"});
		}
		else{
			res.json(apiCache.bells);
		}
		
	});
	router.get("/bells",function(req,res){
		if(apiCache.updatedYear < new Date()){
			updateApiCache();
			res.json({err:true,action:"reload"});
		}
		else{
			res.json(apiCache.bells);
		}
		
	})
	app.use("/api",router);
};