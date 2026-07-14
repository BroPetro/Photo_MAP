const button_Back = document.querySelector(".button_Back");
const buttonProfile = document.querySelector(".button_profile");


// Кнопка додавання фото
button_Back.addEventListener("click", () => {
    window.location.href = "index.html";
});

// Кнопка профілю
buttonProfile.addEventListener("click", () => {
    window.location.href = "profile.html";
});

// Створюємо карту
const photoMap = L.map('photoMap').setView([49.8397, 24.0297], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(photoMap);

let marker;

// Отримання геолокації
if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(function(position) {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Переміщуємо карту
        photoMap.setView([lat, lng], 16);

        // Ставимо маркер
        marker = L.marker([lat, lng]).addTo(photoMap);

        // Записуємо координати
        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;

    }, function(error) {
        console.log("Не вдалося отримати геолокацію:", error.message);
    });

}

// Вибір місця натисканням на карту
photoMap.on("click", function(e) {

    if (marker) {
        photoMap.removeLayer(marker);
    }

    marker = L.marker(e.latlng).addTo(photoMap);

    document.getElementById("latitude").value = e.latlng.lat;
    document.getElementById("longitude").value = e.latlng.lng;

});