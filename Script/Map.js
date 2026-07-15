// Імпортуємо необхідне з твого firebase.js
import { database } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Іконка для геолокації користувача
const myIcon = L.icon({
    iconUrl: 'icons/MyLocation.png', 
    iconSize: [40, 40],              
    iconAnchor: [20, 40]             
});

// Підгружаємо кнопку геолокації
const buttonLocation = document.querySelector(".button_lacation");

// Підгружаємо головну фонову карту
const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Отримання поточної локації користувача
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.setView([lat, lng], 16);
        L.marker([lat, lng], {
            icon: myIcon
        }).addTo(map);
    }, function(error) {
        console.log("Не вдалося отримати локацію користувача:", error.message);
    });
}

// Кнопка центрування на собі
buttonLocation.addEventListener("click", function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 16);
        });
    }
});

// --- ЗАВАНТАЖЕННЯ ТА ВІДОБРАЖЕННЯ ФОТОГРАФІЙ З FIREBASE ---

const photosRef = ref(database, 'photos');

onValue(photosRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Очищуємо старі маркери фотографій, якщо вони були (за бажанням), або просто наносимо нові
    Object.keys(data).forEach((key) => {
        const photo = data[key];

        if (photo.latitude && photo.longitude && photo.imageText) {
            
            // Створюємо кастомну круглу іконку-прев'ю із завантаженого зображення
            const photoIcon = L.divIcon({
                className: 'custom-photo-marker',
                html: `<div class="marker-photo-wrapper" style="background-image: url(${photo.imageText});"></div>`,
                iconSize: [45, 45],
                iconAnchor: [22, 22]
            });

            // Форматуємо дату публікації
            const publishDate = photo.timestamp ? new Date(photo.timestamp).toLocaleDateString("uk-UA") : "Невідомо";

            // Вміст спливаючого вікна (Popup) при кліці
            const popupContent = `
                <div class="photo-popup-container">
                    <div class="photo-popup-image-holder">
                        <img src="${photo.imageText}" alt="Фото на карті" class="photo-popup-img">
                    </div>
                    <div class="photo-popup-info">
                        <p class="popup-description">${photo.description || "<i>Опис відсутній</i>"}</p>
                        <div class="popup-metadata">
                            <span><b>Камера:</b> ${photo.camera || "Не вказано"}</span>
                            <span><b>Об'єктив:</b> ${photo.lens || "Не вказано"}</span>
                            <span class="popup-date"><b>Дата:</b> ${publishDate}</span>
                        </div>
                    </div>
                </div>
            `;

            // Створюємо маркер і додаємо його на карту
            L.marker([photo.latitude, photo.longitude], { icon: photoIcon })
                .addTo(map)
                .bindPopup(popupContent, {
                    maxWidth: 290,
                    className: 'custom-leaflet-popup'
                });
        }
    });
});