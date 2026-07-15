import { auth, database } from "./firebase.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, push, set, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

let currentUser = null;
let currentUsername = "Анонім";

// 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ ТА ОТРИМАННЯ ІМЕНІ АВТОРА
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Якщо користувач не увійшов, відправляємо на реєстрацію
        window.location.href = "register.html";
    } else {
        currentUser = user;
        
        // Отримуємо ім'я користувача (username) з бази даних
        const userRef = ref(database, `users/${user.uid}`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                currentUsername = snapshot.val().username || "Користувач";
            }
        }).catch((error) => {
            console.error("Помилка отримання профілю користувача:", error);
        });
    }
});

// Кнопки навігації
const button_Back = document.querySelector(".button_Back");
const buttonProfile = document.querySelector(".button_profile");
const photoUploadInput = document.getElementById("photo-upload");
const previewImage = document.getElementById("preview-image");
const uploadForm = document.getElementById("uploadForm");

button_Back.addEventListener("click", () => {
    window.location.href = "index.html";
});

buttonProfile.addEventListener("click", () => {
    window.location.href = "profile.html";
});

// 2. СТВОРЕННЯ КАРТИ ДЛЯ ВИБОРУ ЛОКАЦІЇ
const photoMap = L.map('photoMap').setView([49.8397, 24.0297], 13); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(photoMap);

let marker;

// Визначення поточної геолокації користувача при відкритті
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        photoMap.setView([lat, lng], 16);
        marker = L.marker([lat, lng]).addTo(photoMap);

        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;
    }, function(error) {
        console.log("Не вдалося отримати геолокацію:", error.message);
    });
}

// Вибір місця на карті вручну (кліком)
photoMap.on("click", function(e) {
    if (marker) {
        photoMap.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(photoMap);
    document.getElementById("latitude").value = e.latlng.lat;
    document.getElementById("longitude").value = e.latlng.lng;
});

// 3. ОБРОБКА ТА СТИСНЕННЯ ЗОБРАЖЕННЯ
let compressedBase64 = "";

photoUploadInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Відображаємо прев'ю на екрані
            if (previewImage) previewImage.src = e.target.result;
            // Стискаємо зображення (робимо ресайз до оптимального розміру ~200-300 KB)
            compressedBase64 = compressAndResizeImage(img, 200, 300);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Функція стиснення зображення перед завантаженням у Firebase
function compressAndResizeImage(img, minKB, maxKB) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxDimension = 1200; // Максимальна ширина/висота фото
    let width = img.width;
    let height = img.height;

    if (width > height) {
        if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
        }
    } else {
        if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
        }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.85;
    let base64Result = "";
    let sizeInKB = 0;

    // Цикл підбору якості для досягнення оптимального розміру
    for (let i = 0; i < 10; i++) {
        base64Result = canvas.toDataURL("image/jpeg", quality);
        sizeInKB = (base64Result.length * (3 / 4)) / 1024;

        if (sizeInKB > maxKB) {
            quality -= 0.1;
        } else if (sizeInKB < minKB && quality < 0.95) {
            quality += 0.05;
            break;
        } else {
            break;
        }
    }
    return base64Result;
}

// 4. ВІДПРАВКА ДАНИХ У FIREBASE REALTIME DATABASE
uploadForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const lat = document.getElementById("latitude").value;
    const lng = document.getElementById("longitude").value;
    const lens = document.getElementById("lens").value.trim();
    const camera = document.getElementById("camera").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!compressedBase64) {
        alert("Будь ласка, оберіть фотографію!");
        return;
    }

    if (!lat || !lng) {
        alert("Будь ласка, позначте на карті місце зйомки!");
        return;
    }

    const photosRef = ref(database, 'photos');
    const newPhotoRef = push(photosRef);

    // Зберігаємо інформацію про фото, локацію, технічні дані, автора та лайки
    const photoData = {
        userId: currentUser ? currentUser.uid : "anonymous",
        username: currentUsername, // Записуємо ім'я автора
        imageText: compressedBase64,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        lens: lens || "Не вказано",
        camera: camera || "Не вказано",
        description: description || "",
        timestamp: Date.now(),
        likes: {} // На початку список лайків порожній
    };

    set(newPhotoRef, photoData)
        .then(() => {
            alert("Фото успішно опубліковано!");
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Помилка відправки даних:", error);
            alert("Помилка при збереженні в базу.");
        });
});