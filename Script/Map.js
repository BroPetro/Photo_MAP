//Підгружаєм фотку !!
const myIcon = L.icon({
    iconUrl: 'icons/MyLocation.png', 
    iconSize: [40, 40],              
    iconAnchor: [20, 40]             
});
//підгружаєм кнопку геолокації
const buttonLocation = document.querySelector(".button_lacation");


//Підгружаєм карту
const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

//підгружаэм локацію
navigator.geolocation.getCurrentPosition(function(position) {
    
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    console.log(lat);
    console.log(lng);

    map.setView([lat, lng], 16);
    L.marker([lat, lng], {
    icon: myIcon
    }).addTo(map);
});

buttonLocation.addEventListener("click", function () {

    navigator.geolocation.getCurrentPosition(function(position) {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            map.setView([lat, lng], 16);
        });
    });

