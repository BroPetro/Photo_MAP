import { database } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Іконка для геолокації користувача
const myIcon = L.icon({
    iconUrl: 'icons/MyLocation.png', 
    iconSize: [40, 40],              
    iconAnchor: [20, 40]             
});

const buttonLocation = document.querySelector(".button_lacation");

// Елементи інтерфейсу деталей фотографії
const sidebar = document.getElementById("details-sidebar");
const sidebarClose = document.querySelector(".sidebar-close-btn");
const sidebarDragHandle = document.querySelector(".sidebar-drag-handle");
const sidebarImg = document.getElementById("sidebar-img");
const sidebarDesc = document.getElementById("sidebar-description");
const sidebarCamera = document.getElementById("sidebar-camera");
const sidebarLens = document.getElementById("sidebar-lens");
const sidebarDate = document.getElementById("sidebar-date");

// Елементи повноекранного режиму
const fullscreenOverlay = document.getElementById("fullscreen-overlay");
const fullscreenImg = document.getElementById("fullscreen-img");
const fullscreenClose = document.querySelector(".fullscreen-close");

// Ініціалізація карти
const map = L.map('map', {
    zoomControl: false // Прибираємо зайві кнопки контролю
}).setView([20, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Отримання поточної геолокації
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 14);
        L.marker([lat, lng], { icon: myIcon }).addTo(map);
    }, function(error) {
        console.log("Геолокацію не визначено:", error.message);
    });
}

// БЕЗПЕЧНА ПЕРЕВІРКА кнопки локації (запобігає падінню скрипту)
if (buttonLocation) {
    buttonLocation.addEventListener("click", function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 14);
            });
        }
    });
}

// --- ЗЧИТУВАННЯ ФОТОГРАФІЙ З БАЗИ ---
const photosRef = ref(database, 'photos');

onValue(photosRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    Object.keys(data).forEach((key) => {
        const photo = data[key];

        if (photo.latitude && photo.longitude && photo.imageText) {
            
            // Кастомна кругла іконка з прев'ю фото
            const photoIcon = L.divIcon({
                className: 'custom-photo-marker',
                html: `<div class="marker-photo-wrapper" style="background-image: url(${photo.imageText});"></div>`,
                iconSize: [46, 46],
                iconAnchor: [23, 23]
            });

            // Створюємо маркер
            const marker = L.marker([photo.latitude, photo.longitude], { icon: photoIcon }).addTo(map);

            // КЛІК НА МАРКЕР — Відкриття деталей у шторці
            marker.on('click', () => {
                // Заповнюємо даними
                if (sidebarImg) sidebarImg.src = photo.imageText;
                if (sidebarDesc) sidebarDesc.innerHTML = photo.description ? photo.description.replace(/\n/g, '<br>') : '<i>Без опису</i>';
                if (sidebarCamera) sidebarCamera.textContent = photo.camera || "Не вказано";
                if (sidebarLens) sidebarLens.textContent = photo.lens || "Не вказано";
                
                const publishDate = photo.timestamp ? new Date(photo.timestamp).toLocaleDateString("uk-UA") : "Невідомо";
                if (sidebarDate) sidebarDate.textContent = publishDate;

                // Плавно центруємо карту трохи вище від маркера
                const targetPoint = map.project([photo.latitude, photo.longitude], map.getZoom());
                if (window.innerWidth < 768) {
                    targetPoint.y += 120; // посунемо вниз, щоб маркер не ховався під шторку
                } else {
                    targetPoint.x -= 100; // на ПК посунемо вправо від панелі
                }
                map.panTo(map.unproject(targetPoint, map.getZoom()), { animate: true, duration: 0.6 });

                // Відкриваємо шторку деталей
                if (sidebar) sidebar.classList.add("active");
            });
        }
    });
});

// Закриття панелі деталей
const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove("active");
};
if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
if (sidebarDragHandle) sidebarDragHandle.addEventListener("click", closeSidebar);

// Клік на мапу закриває панель деталей
map.on("click", closeSidebar);

// --- ПОВНОЕКРАННИЙ ПЕРЕГЛЯД ЗОБРАЖЕННЯ ---
if (sidebarImg) {
    sidebarImg.addEventListener("click", () => {
        if (sidebarImg.src && fullscreenImg && fullscreenOverlay) {
            fullscreenImg.src = sidebarImg.src;
            fullscreenOverlay.classList.add("active");
        }
    });
}

const closeFullscreen = () => {
    if (fullscreenOverlay) fullscreenOverlay.classList.remove("active");
};

if (fullscreenClose) fullscreenClose.addEventListener("click", closeFullscreen);
if (fullscreenOverlay) {
    fullscreenOverlay.addEventListener("click", (e) => {
        if (e.target !== fullscreenImg) {
            closeFullscreen();
        }
    });
}

// Знаходимо кнопки на головній сторінці
const buttonCreate = document.querySelector(".button_create");
const buttonProfile = document.querySelector(".button_profile");

// Кнопка додавання фото — перенаправляє на сторінку створення
if (buttonCreate) {
    buttonCreate.addEventListener("click", () => {
        window.location.href = "CreatePhoto.html";
    });
}

// Кнопка профілю — перенаправляє на сторінку профілю
if (buttonProfile) {
    buttonProfile.addEventListener("click", () => {
        window.location.href = "profile.html";
    });
}