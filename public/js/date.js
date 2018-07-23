function renderTime(){
	var mydate = new Date();
	var year = mydate.getYear();
	if(year < 1000){
		year = year + 1900;
	}
	var day = mydate.getDay();
	var month = mydate.getMonth();
	var date = mydate.getDate();
	var dayarray = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
	var montharray = new Array("Jan","Feb","Mar","April","May","June","July","Aug","Sept","Oct","Nov","Dec");

	var myClock = document.getElementById('dateDisplay');
	myClock.innerText = "" + dayarray[day] + "" + date + "" + montharray[month] + "" + year;
	myClock.textContent = "" + dayarray[day]+" | " + "" + date + " " + montharray[month] + " " + year;

	setTimeout("renderTime",1000);
}
renderTime();