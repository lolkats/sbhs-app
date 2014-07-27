function getTimetable() {
  $.ajax({
    type: "GET",
    dataType: 'json',
    url: "/api/timetable",
    success: function(data) {
      timetable = data;
      if (window.localStorage) {
        localStorage.setItem('timetable', JSON.stringify(data));
        console.log("Caching timetable");
      } else {
        console.log('localStorage not supported');
      }
    },
    error: function(){
    	console.log("Could not load timetable. Attempting to load from localStorage.");
    	if(window.localStorage) {
    		timetable = JSON.parse(localStorage.getItem('timetable'));
    		console.log("Successfully loaded timetable from localStorage.");
    	}
    	else{
    		console.log("There's nothing I can do to load your timetable");
    	}
    }
  });
};
getTimetable();
function generatePrintableTimetable(element,options){
  var timetableMap = {};
  var timetableWeeks = {};
  element = $(element);
  Object.keys(timetable.subjects).forEach(function(subject){
    timetableMap[timetable.subjects[subject].shortTitle] = timetable.subjects[subject].subject;
  });
  Object.keys(timetable.days).forEach(function(day){
    var todayTT = {};
    todayTT.periods = [];
    var week = timetable.days[day].dayname.slice(-1);
    todayTT.dayName = timetable.days[day].dayname;
    if(!timetableWeeks[week]) timetableWeeks[week] = [];
    var routine = timetable.days[day].routine.replace('R','').replace('T','').split("");
    var periods = timetable.days[day].periods;
    routine.forEach(function(r){
      if(r == "="){
        todayTT.periods.push({subject:"=",room:"="});
      }
      else if(r == "T" || r=="R"){
        return;
      }
      else{
        if(!periods[r]){ todayTT.periods.push({subject:false,room:false});} 
        else {todayTT.periods.push({subject:periods[r].title, room:periods[r].room});}
      }
    });
    timetableWeeks[week].push(todayTT);
  });
  function generateTable(tt){
    var table = document.createElement('table');
    table.className = 'table';
    Object.keys(tt).forEach(function(week){
      weekName = week;
      week = tt[week];
      var tr = document.createElement('tr');
      var weekTd = document.createElement('td');
      weekTd.innerHTML = "Week "+weekName;
      tr.appendChild(weekTd);
      week.forEach(function(day){
        var dayTr = document.createElement('tr');
        var dayTd = document.createElement('td');
        dayTd.innerHTML = day.dayName;
        dayTr.style.display="table-cell";
        dayTr.appendChild(dayTd);
        day.periods.forEach(function(period){
          var periodTr = document.createElement('tr');
          var roomTd = document.createElement('td');
          roomTd.innerHTML = period.room;
          var subjectTd = document.createElement('td');
          subjectTd.innerHTML = period.subject;
          periodTr.appendChild(subjectTd);
          periodTr.appendChild(roomTd);
          dayTr.appendChild(periodTr);
        });
        tr.appendChild(dayTr);
      });
      table.appendChild(tr);
    });
    return table;
  };
  element.html(generateTable(timetableWeeks));
};