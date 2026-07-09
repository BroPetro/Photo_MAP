const map = L.map('map', {

	zoomControl: false,
	attributionControl: false,
	dragging: false,
	scrollWheelZoom: false,
	doubleClickZoom: false,
	boxZoom: false,
	keyboard: false,
	touchZoom: false,
});

map.setView([30, 15], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
	maxZoom:19

}).addTo(map);



