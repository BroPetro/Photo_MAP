import { auth, database } from "./firebase.js"; // Імпортуємо auth та database з твого конфігу
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, push, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Змінна для збереження поточного авторизованого користувача
let currentUser = null;

// ПЕРЕВІРКА АВТОРИЗАЦІЇ: якщо не увійшов — перекидаємо на реєстрацію
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "register.html";
    } else {
        currentUser = user;
        console.log("Авторизовано користувача з ID:", user.uid);
    }
});

const button_Back = document.querySelector(".button_Back");
const buttonProfile = document.querySelector(".button_profile");
const photoUploadInput = document.getElementById("photo-upload");
const previewImage = document.getElementById("preview-image");
const uploadForm = document.getElementById("uploadForm");

// Кнопка додавання фото
button_Back.addEventListener("click", () => {
    window.location.href = "index.html";
});

// Кнопка профілю
buttonProfile.addEventListener("click", () => {
    window.location.href = "profile.html";
});

// Створюємо карту Leaflet
const photoMap = L.map('photoMap').setView([49.8397, 24.0297], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(photoMap);

let marker;

// Отримання геолокації користувача
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

// Сюди запишеться закодоване зображення в Base64
let compressedBase64 = "";

// Обробка завантаження файлу та стиснення до 200-300 КБ
photoUploadInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Візуально оновлюємо прев'ю на сторінці
            previewImage.src = e.target.result;
            previewImage.style.maxHeight = "150px"; 

            // Запускаємо інтелектуальне стиснення через Canvas
            compressedBase64 = compressAndResizeImage(img, 200, 300);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Функція стиснення зображення за допомогою Canvas
function compressAndResizeImage(img, minKB, maxKB) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Обмежуємо максимальну роздільну здатність для оптимізації ваги тексту
    const maxDimension = 1200;
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

    let quality = 0.92; // Стартова якість
    let base64Result = "";
    let sizeInKB = 0;

    // Робимо до 10 спроб підібрати ідеальну якість під ліміт 200-300 КБ
    for (let i = 0; i < 10; i++) {
        base64Result = canvas.toDataURL("image/jpeg", quality);
        
        // Розраховуємо приблизну вагу Base64 рядка в КБ
        sizeInKB = (base64Result.length * (3 / 4)) / 1024;

        if (sizeInKB > maxKB) {
            quality -= 0.1; // Зменшуємо якість, якщо файл завеликий
        } else if (sizeInKB < minKB && quality < 0.95) {
            quality += 0.05; // Трохи збільшуємо, якщо замалий
            break;
        } else {
            break; // Потрапили в діапазон
        }
    }

    console.log(`Зображення стиснено: ${sizeInKB.toFixed(2)} KB (якість: ${quality.toFixed(2)})`);
    return base64Result;
}

// Завантаження даних у Firebase Realtime Database
uploadForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const lat = document.getElementById("latitude").value;
    const lng = document.getElementById("longitude").value;
    const lens = document.getElementById("lens").value.trim();
    const camera = document.getElementById("camera").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!compressedBase64) {
        alert("Будь ласка, виберіть спочатку фотографію!");
        return;
    }

    if (!lat || !lng) {
        alert("Будь ласка, вкажіть місце зйомки на карті!");
        return;
    }

    // Створюємо посилання на нову гілку в базі
    const photosRef = ref(database, 'photos');
    const newPhotoRef = push(photosRef);

    const photoData = {
        userId: currentUser ? currentUser.uid : "anonymous", // Зберігаємо ID автора фото
        imageText: compressedBase64, // Фото у текстовому форматі Base64
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        lens: lens || "Не вказано",
        camera: camera || "Не вказано",
        description: description || "",
        timestamp: Date.now()
    };

    set(newPhotoRef, photoData)
        .then(() => {
            alert("Фото успішно опубліковано!");
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Помилка відправки:", error);
            alert("Помилка завантаження. Спробуйте ще раз.");
        });
});