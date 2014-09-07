/*
	SBHS App
*/
function counter(displayBlock){
	var bells;
	var times;
	var bellNames;
	var bellsLoaded = false;
	var calendarLoaded = false;
	var yearCalendar;
	var counterInterval;
	var days2School;
	var elements = {};
	var nextPeriod;
	var rolledOver = false;
	function padZero(n, width, z) {
	  z = z || '0';
	  width = width || 2;
	  n = n + '';
	  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}

	function yyyymmdd(date){
		var date = new Date(date);
		var year = date.getFullYear(), month = (date.getMonth() + 1), day = date.getDate();
		if (month < 10) month = "0" + month;
		if (day < 10) day = "0" + day;
		var properlyFormatted = "" + year + "-" + month + "-" + day;
		return properlyFormatted;
	};
	function getCalendar(){
		$.ajax({
			type:'GET',
			dataType:'json',
			url:'/api/calendaryear',
			success:function(data){
				yearCalendar = data;
				calendarLoaded = true;
				if(window.localStorage){
					localStorage.setItem('calendarYear', JSON.stringify(yearCalendar));
				}
				calculateDay();
			}
		});
	};
	function changeBellNames(){
		bellNames[0] = "School Starts";
		for(var i = 0;i<bellNames.length;i++){
			if(parseInt(bellNames[i])){
				bellNames[i] = "Period "+ bellNames[i];
			}
		}
	}
	function authenChangeBellNames(){
		var timetableMap = {};

		Object.keys(dayTimetable.timetable.subjects).forEach(function(subject){
			timetableMap[dayTimetable.timetable.subjects[subject].shortTitle] = dayTimetable.timetable.subjects[subject].subject;
		});
		bellNames[0] = "School Starts";
		for(var i = 0;i<bellNames.length;i++){
			if(parseInt(bellNames[i].slice(-1)) && bellNames[i].substring(0,6) == "Period"){
				bellNames[i] = timetableMap[dayTimetable.timetable.timetable.periods[bellNames[i].slice(-1)].title];
			}
		}
	}
	function getBelltimes(date){
		$.ajax({
			type:'GET',
			dataType:'jsonp',
			url:"http://student.sbhs.net.au/api/timetable/bells.json?date="+date,
			success:function(data){
				if(data.status == 'Error' || data.status == 'error' || data.status == false){
					var newDateToGet = new Date(date);
					newDateToGet.setDate(newDateToGet.getDate() + 1);
					getBelltimes(yyyymmdd(newDateToGet));
					return;
				}
				else{
					times = [];
					bellNames = [];
					bells = data;
					bells.bells.forEach(function(bt){
						times.push(new Date(bells.date + " " + bt.time));
						bellNames.push(bt.bell);
					});
					changeBellNames();
					bellsLoaded = true;
					console.log(window.authenticated);
					if(window.authenticated){
						getDayTimetable(date);
					}
				}
			}
		});
	};
	function getDayTimetable(date){
		$.ajax({
			type:'GET',
			dataType:'json',
			url:"/api/daytimetable?date="+date,
			success:function(data){
				if(data.status == 'Error' || data.status == 'error' || data.status == false){
					return;
				}
				else{
					dayTimetable = data;
					authenChangeBellNames();
				}
			}
		});		
	};
	function calculateDay(){
		// Use some calendar data
		var today = (new Date());
		var todayDate = yyyymmdd(today);
		var calendarForToday = yearCalendar[todayDate];
		var dayToGet;
		function getDateToGet(daysLeft){
			dtg = new Date();
			dtg.setDate(dtg.getDate() + daysLeft);
			return yyyymmdd(dtg);
		}
		if(calendarForToday.term == "0" || calendarForToday.term == 0 || calendarForToday.term == false){
			dateTooFar();
		}
		else if(today.getDay() == 0 || today.getDay() == 6){
			if(today.getDay() == 0){
				days2School = 1;
				dayToGet = getDateToGet(days2School);
				if(yearCalendar[dayToGet].term == 0 || yearCalendar[dayToGet].term == 0 || yearCalendar[dayToGet].term == false){
					dateTooFar();
				}
			}
			else if(today.getDay() == 6){
				days2School = 2;
				dayToGet = getDateToGet(days2School);
				if(yearCalendar[dayToGet].term == 0 || yearCalendar[dayToGet].term == 0 || yearCalendar[dayToGet].term == false){
					dateTooFar();
				}
			}
		}
		else if(today.getDay() == 5 && (new Date()).getTime() >= (new Date()).setHours(15,15,0,0)){
			days2School = 3;
			dayToGet = getDateToGet(days2School);
			console.log("END OF FRIDAY");
		}
		/*else if(calendarForToday.dayNumber == 0){

		}*/
		else if((new Date()).getTime() >= (new Date()).setHours(15,15,0,0)){
			days2School = 1;
			dayToGet = getDateToGet(days2School);
		}
		else{
			days2School = 0;
			dayToGet = todayDate;
		}
		getBelltimes(dayToGet);
	};
	function dateTooFar(){
		window.location = "http://www.google.com.au";
	};
	function findNextClass(){
		var now = new Date();
		function nextDate( startDate, dates ) {
		    var startTime = +startDate;
		    var nearestDate, nearestDiff = Infinity;
		    for( var i = 0, n = dates.length;  i < n;  ++i ) {
		        var diff = +dates[i] - startTime;
		        if( diff > 0  &&  diff < nearestDiff ) {
		            nearestDiff = diff;
		            nearestDate = dates[i];
		        }
		    }
		    return nearestDate;
		};
		var nextBell = nextDate(now,times);
		var bellNumber = times.indexOf(nextBell);
		return{bell:nextBell, subject:bellNames[bellNumber]};
	};
	function doCount(){
		var now = new Date();
		var oneSecond = 1000;
		var oneMinute = oneSecond * 60;
		var oneHour = oneMinute * 60;
		var oneDay = oneHour * 24;
		if(bellsLoaded == false){
			return;
			console.log("bellsNotLoaded");
		}
		else{
			if(now.getTime() >= (new Date()).setHours(9,0,0,0) &&  now.getTime() < (new Date()).setHours(15,15,0,0)  && rolledOver == true && yyyymmdd(now) == bells.date){
				rolledOver = false;
				console.log("rolledOverNot");
			}
			else if(now.getTime() >= (new Date()).setHours(15,15,0,0) && rolledOver == false && yyyymmdd(now) == bells.date){
				rolledOver = true;
				bellsLoaded = false;
				console.log("rolledOver");
				calculateDay();
			}
			else{
				// Normal Count
				if(bells.bellsAltered == true){
					elements.variation.innerHTML = "Changed Bells: " + bells.bellsAlteredReason;
				}
				if(!nextPeriod){
					nextPeriod = findNextClass();
					doCount();
				}
				else if(nextPeriod.bell.getTime() < now){
					nextPeriod = findNextClass();
					doCount();
				}
				else{
					var timeToEnd = nextPeriod.bell - now;
					var days = Math.floor(timeToEnd / oneDay);
					var hours = Math.floor((timeToEnd % oneDay) / oneHour);
			        var minutes = Math.floor((timeToEnd % oneHour) / oneMinute);
			        var seconds = Math.floor((timeToEnd % oneMinute) / oneSecond);
			        elements.time.innerHTML = "";
			        if(days != 0) elements.time.innerHTML += days +'d ';
			        if(hours != 0) elements.time.innerHTML += padZero(hours) + 'h ';
			        elements.time.innerHTML += padZero(minutes) + 'm ';
			        elements.time.innerHTML += padZero(seconds) + 's';
			        elements.subject.innerHTML = nextPeriod.subject;
			        elements.week.innerHTML = "Week "+ bells.week + bells.weekType;
				}
			}
		}	
	};
	function initDisplay(){
		var elementsToPush = [];
		var weekDiv = document.createElement('div');
		weekDiv.className = 'week_counter';
		elements.week = weekDiv;
		elementsToPush.push(weekDiv);
		var variationDiv = document.createElement('div');
		variationDiv.className = 'variation_counter';
		elements.variation = variationDiv;
		elementsToPush.push(variationDiv);
		var subject = document.createElement('div');
		subject.className = 'subject_counter';
		subject.innerHTML = 'A';
		elements.subject = subject;
		elementsToPush.push(subject);
		var inDiv = document.createElement('div');
		inDiv.className = 'in_counter';
		inDiv.innerHTML = "In";
		elements.in = inDiv;
		elementsToPush.push(inDiv);
		var timeDiv = document.createElement('div');
		timeDiv.className = 'time_counter';
		timeDiv.innerHTML = 'B';
		elements.time = timeDiv;
		elementsToPush.push(timeDiv);
		$(displayBlock).append(elementsToPush);
	};
	function init(){
		initDisplay();
		getCalendar();
		counterInterval = setInterval(doCount,1000);
	};
	init();
};
$(document).ready(function(){
	counter(document.getElementById('counter'));
});