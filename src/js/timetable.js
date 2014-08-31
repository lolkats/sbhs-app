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