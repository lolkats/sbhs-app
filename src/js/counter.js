/*
	SBHS App
*/
const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;
const oneDay = oneHour * 24;
function counter(displayBlock){
	var bells;
	var times;
	var bellsLoaded = false;
	var calendarLoaded = false;
	var yearCalendar = {};
	var counterInterval;
	var days2School;
	var elements = {};
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
	function getCalendar(cb){
		calendarLoaded = false;
		if(!cb){
			cb = function(){};
		}
		$.ajax({
			type:'GET',
			dataType:'json',
			url:'/api/calendaryear',
			success:function(data){
				if(data.reason =="reload"){
					return getCalendar();
				}
				yearCalendar = data;
				calendarLoaded = true;
				if(window.localStorage){
					localStorage.setItem('calendarYear', JSON.stringify(yearCalendar));
				}
				cb();
			}
		});
	};
	function getBellTimes(date){
		bellsLoaded = false;
		date = date || calculateDay();
		$.ajax({
			type:'GET',
			dataType:'jsonp',
			url:'https://student.sbhs.net.au/api/timetable/bells.json?date='+date,
			success:function(data){
				if(data.status == 'Error'){
					var next = new Date(date);
					next.setDate(next.getDate+1);
					return(getBellTimes(next));
				}
				bellConvert(data.bells,date);
				bellsLoaded = true;
			}
		});
	};
	function calculateDay(from){
		var date = new Date(from || new Date());
		var eod = new Date(date).setHours(15,15,0,0);
		var todayDate = yyyymmdd(date);
		if(!yearCalendar[todayDate]){
			return getCalendar();
		}
		else if(yearCalendar[todayDate].dayNumber == '0' || !yearCalendar[todayDate].dayNumber){
			var next = new Date(todayDate);
			next.setDate(next.getDate()+1);
			return calculateDay(new Date(next));
		}
		else if(new Date(date).getTime() >= eod){
			var next = new Date(todayDate);
			next.setDate(next.getDate()+1);
			return calculateDay(new Date(next));
		}
		else{
			return todayDate;
		}
	};
	function bellConvert(obj,date){
		var arr = $.map(obj, function(el) { return el; });
		times = [];
		bells = [];
		arr.forEach(function(bell){
			var time = new Date(date);
			var bellSplit = bell.time.split(":");
			time.setHours(bellSplit[0],bellSplit[1],0,0);
			if(bell.bell == "Roll Call"){
				bells.push("School Starts");
			}
			else{
				bells.push(bell.bell);
			}
			times.push(time);
		});
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
		return{time:nextBell, subject:bells[bellNumber]};
	};
	function doCount(){
		if(!bellsLoaded){
			return
		}
		var nextClass = findNextClass();
	    var now = new Date();
	    var distance = nextClass.time - now;
	    var output = [];
	    var days = Math.floor(distance / oneDay);
	    var hours = Math.floor((distance % oneDay) / oneHour);
	    var minutes = padZero(Math.floor((distance % oneHour) / oneMinute));
	    var seconds = padZero(Math.floor((distance % oneMinute) / oneSecond));
	    elements.countdown.innerHTML = "";
	    if(days){
	    	elements.countdown.innerHTML += days+"d, ";
	    }
	    if(hours){
	    	elements.countdown.innerHTML += hours+"h, ";
	    }
	    if(parseInt(minutes)){
	    	elements.countdown.innerHTML += minutes+"m, ";
	    }
	    elements.countdown.innerHTML+= seconds+"s";
	    elements.subject.innerHTML = nextClass.subject;
	};
	function initDisplay(){
		elements.changedBells = document.createElement('div');
		elements.week = document.createElement('div');
		elements.subject = document.createElement('div');
		elements.subject.className = "subject_counter";
		elements.in = document.createElement('div');
		elements.in.innerHTML = "in";
		elements.countdown = document.createElement('div');
		elements.countdown.className = "time_counter";
		Object.keys(elements).forEach(function(e){
			displayBlock.appendChild(elements[e]);
		});

	}
	function init(){
		initDisplay();
		getCalendar(getBellTimes);
		counterInterval = setInterval(doCount,1000);
		return counterInterval;
	}
	return init();

};
$(document).ready(function(){
	counter(document.getElementById('counter'));
});