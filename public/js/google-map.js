var lat = 40.712784;
var lng = -74.005941;
var finalFunc = null;
var map = null;
var pos = 'Odessa, Odessa Oblast, Ukraine';

function loadMap(idMapCanvas, latitude, longitude, accuracy) {
	if (!google)
		return;

	var latlng = new google.maps.LatLng(latitude, longitude);
	var optionsMap = {
		zoom : 15,
		center : latlng,
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map(document.getElementById(idMapCanvas), optionsMap);
	var optionsCircle = {
		center : latlng,
		map : map,
		radius : parseInt(accuracy),
		clickable : false,
		fillColor : "#00AAFF",
		fillOpacity : 0.3,
		strokeColor : "#057CB8",
		strokeOpacity : 0.8,
		strokeWeight : 1
	};
	var circle = new google.maps.Circle(optionsCircle);
}
	
function initGeolocation(func) {
	finalFunc = func;
	loadMap("map_canvas", lat, lng, 0);
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function onSuccess(position){
	lat = position.coords.latitude;
	lng = position.coords.longitude;

	var latlng = new google.maps.LatLng(lat, lng);
	map.setCenter(latlng);

	if (finalFunc){
		finalFunc();
	}
}		
		
function onError(error){
	if (finalFunc){
		finalFunc();
	}
}

