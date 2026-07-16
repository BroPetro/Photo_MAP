import { auth, database } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

let currentUser = null;

// Перевірка авторизації
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    }
});

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
const sidebarAuthor = document.getElementById("sidebar-author");

// Лайки
const likeButton = document.getElementById("like-button");
const likeIcon = likeButton.querySelector(".like-icon");
const likeCountSpan = document.getElementById("like-count");

// Елементи повноекранного режиму
const fullscreenOverlay = document.getElementById("fullscreen-overlay");
const fullscreenImg = document.getElementById("fullscreen-img");
const fullscreenClose = document.querySelector(".fullscreen-close");

// Зберігатимемо ID відкритої наразі фотографії
let currentOpenedPhotoId = null; 

// Ініціалізація карти
const map = L.map('map', {
    zoomControl: false 
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

buttonLocation.addEventListener("click", function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 14);
        });
    }
});

// --- ЗЧИТУВАННЯ ФОТОГРАФІЙ З БАЗИ ---
const photosRef = ref(database, 'photos');

onValue(photosRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    Object.keys(data).forEach((key) => {
        const photo = data[key];

        if (photo.latitude && photo.longitude && photo.imageText) {
            
            const photoIcon = L.divIcon({
                className: 'custom-photo-marker',
                html: `<div class="marker-photo-wrapper" style="background-image: url(${photo.imageText});"></div>`,
                iconSize: [46, 46],
                iconAnchor: [23, 23]
            });

            const marker = L.marker([photo.latitude, photo.longitude], { icon: photoIcon }).addTo(map);

            marker.on('click', () => {
                currentOpenedPhotoId = key; // Запам'ятовуємо ID фотографії

                // Заповнюємо даними
                sidebarImg.src = photo.imageText;
                sidebarDesc.innerHTML = photo.description ? photo.description.replace(/\n/g, '<br>') : '<i>Без опису</i>';
                sidebarCamera.textContent = photo.camera || "Не вказано";
                sidebarLens.textContent = photo.lens || "Не вказано";
                sidebarAuthor.textContent = photo.username || "Анонім"; // Показуємо автора
                
                const publishDate = photo.timestamp ? new Date(photo.timestamp).toLocaleDateString("uk-UA") : "Невідомо";
                sidebarDate.textContent = publishDate;

                // Налаштовуємо лайки для цієї конкретної фотографії
                updateLikesUI(photo.likes);

                // Плавно центруємо карту
                const targetPoint = map.project([photo.latitude, photo.longitude], map.getZoom());
                if (window.innerWidth < 768) {
                    targetPoint.y += 120; 
                } else {
                    targetPoint.x -= 100; 
                }
                map.panTo(map.unproject(targetPoint, map.getZoom()), { animate: true, duration: 0.6 });

                sidebar.classList.add("active");
            });
        }
    });
});

// Функція оновлення відображення лайків
function updateLikesUI(likesData) {
    const totalLikes = likesData ? Object.keys(likesData).length : 0;
    likeCountSpan.textContent = totalLikes;

    // Перевіряємо, чи поточний користувач уже поставив лайк
    if (currentUser && likesData && likesData[currentUser.uid]) {
        likeButton.classList.add("liked");
        likeIcon.innerHTML = "&#9829;"; // Зафарбоване серце ♥
    } else {
        likeButton.classList.remove("liked");
        likeIcon.innerHTML = "&#9825;"; // Порожнє серце ♡
    }
}

// КЛІК НА КНОПКУ ЛАЙКА
likeButton.addEventListener("click", () => {
    if (!currentUser) {
        alert("Будь ласка, увійдіть в акаунт, щоб ставити лайки!");
        return;
    }
    if (!currentOpenedPhotoId) return;

    const photoLikeRef = ref(database, `photos/${currentOpenedPhotoId}/likes/${currentUser.uid}`);
    
    // Перевіряємо статус лайка безпосередньо у базі
    if (likeButton.classList.contains("liked")) {
        // Якщо вже лайкнуто — прибираємо лайк
        remove(photoLikeRef).then(() => {
            likeButton.classList.remove("liked");
            likeIcon.innerHTML = "&#9825;";
            // Оновлюємо локальну кількість на -1 на екрані для швидкості відгуку
            likeCountSpan.textContent = Math.max(0, parseInt(likeCountSpan.textContent) - 1);
        });
    } else {
        // Якщо ще не лайкнуто — ставимо лайк
        set(photoLikeRef, true).then(() => {
            likeButton.classList.add("liked");
            likeIcon.innerHTML = "&#9829;";
            // Оновлюємо локальну кількість на +1
            likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
        });
    }
});

// Закриття панелі деталей
const closeSidebar = () => {
    sidebar.classList.remove("active");
    currentOpenedPhotoId = null;
};
sidebarClose.addEventListener("click", closeSidebar);
sidebarDragHandle.addEventListener("click", closeSidebar);

map.on("click", closeSidebar);

// Повноекранний перегляд
sidebarImg.addEventListener("click", () => {
    if (sidebarImg.src) {
        fullscreenImg.src = sidebarImg.src;
        fullscreenOverlay.classList.add("active");
    }
});

const closeFullscreen = () => {
    fullscreenOverlay.classList.remove("active");
};

fullscreenClose.addEventListener("click", closeFullscreen);
fullscreenOverlay.addEventListener("click", (e) => {
    if (e.target !== fullscreenImg) {
        closeFullscreen();
    }
});