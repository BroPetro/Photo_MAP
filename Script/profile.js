import { auth, database } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// --- ЕЛЕМЕНТИ ІНТЕРФЕЙСУ (ПРОФІЛЬ) ---
const profileAvatar = document.getElementById("profile-avatar");
const profileUsername = document.getElementById("profile-username");
const profileBio = document.getElementById("profile-bio");
const statsPhotosCount = document.getElementById("stats-photos-count");
const userPhotosGrid = document.getElementById("user-photos-grid");

// --- ЕЛЕМЕНТИ МОДАЛЬНОГО ВІКНА ---
const settingsModal = document.getElementById("settings-modal");
const openSettingsBtn = document.getElementById("open-settings-btn");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const cancelSettingsBtn = document.getElementById("cancel-settings-btn");
const editProfileForm = document.getElementById("edit-profile-form");

const avatarInput = document.getElementById("avatar-input");
const avatarPreview = document.getElementById("avatar-preview");
const editUsername = document.getElementById("edit-username");
const editBio = document.getElementById("edit-bio");

// --- КНОПКИ НАВІГАЦІЇ (НИЖНЯ ПАНЕЛЬ) ---
const btnBack = document.querySelector(".button_back");
const btnCreate = document.querySelector(".button_create");
const btnSearch = document.querySelector(".button_search");

let currentUser = null;
let base64Avatar = ""; // Тимчасове збереження нової аватарки в форматі base64

// ==========================================
// 1. КОНТРОЛЬ АВТОРИЗАЦІЇ ТА ЗАВАНТАЖЕННЯ ДАНИХ
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadUserProfile(user.uid);
        loadUserPhotos(user.uid);
    } else {
        // Якщо користувач не увійшов — перенаправляємо на реєстрацію/вхід
        window.location.href = "register.html";
    }
});

// Завантаження інформації про профіль користувача
function loadUserProfile(uid) {
    const userRef = ref(database, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            profileUsername.textContent = data.username || "Користувач";
            profileBio.innerHTML = data.bio ? data.bio.replace(/\n/g, '<br>') : "<i>Опис профілю відсутній</i>";
            
            // Якщо у користувача є аватарка в базі даних
            if (data.photoURL) {
                profileAvatar.src = data.photoURL;
                avatarPreview.src = data.photoURL;
            } else {
                profileAvatar.src = "icons/Accaunt.png";
                avatarPreview.src = "icons/Accaunt.png";
            }

            // Заповнюємо поля у модальному вікні налаштувань заздалегідь
            editUsername.value = data.username || "";
            editBio.value = data.bio || "";
        }
    });
}

// Завантаження лише світлин цього користувача
function loadUserPhotos(uid) {
    const photosRef = ref(database, 'photos');
    onValue(photosRef, (snapshot) => {
        const data = snapshot.val();
        userPhotosGrid.innerHTML = ""; // Очищаємо галерею
        
        if (!data) {
            userPhotosGrid.innerHTML = `<div class="no-photos-msg">Ви ще не завантажили жодного фото.</div>`;
            statsPhotosCount.textContent = "0";
            return;
        }

        let count = 0;
        Object.keys(data).forEach((key) => {
            const photo = data[key];
            // Фільтруємо фото за UID автора
            if (photo.userId === uid) {
                count++;

                // Створюємо елемент сітки для фото
                const photoItem = document.createElement("div");
                photoItem.className = "photo-item";
                photoItem.innerHTML = `<img src="${photo.imageText}" alt="Фото користувача">`;

                // При кліку на фото у галереї профілю повертаємося на карту та фокусуємося на ньому (опціонально)
                photoItem.addEventListener("click", () => {
                    alert(`Обрано фотографію від: ${photo.camera || 'Невідома камера'}. Координати: ${photo.latitude}, ${photo.longitude}`);
                });

                userPhotosGrid.appendChild(photoItem);
            }
        });

        statsPhotosCount.textContent = count;

        if (count === 0) {
            userPhotosGrid.innerHTML = `<div class="no-photos-msg">Ви ще не завантажили жодного фото.</div>`;
        }
    });
}

// ==========================================
// 2. РЕДАГУВАННЯ ПРОФІЛЮ (МОДАЛЬНЕ ВІКНО)
// ==========================================

// Відкрити модальне вікно
if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => {
        settingsModal.classList.add("active");
        base64Avatar = ""; // Скидаємо попередньо завантажений файл
    });
}

// Закрити модальне вікно
const closeModal = () => {
    settingsModal.classList.remove("active");
};
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeModal);
if (cancelSettingsBtn) cancelSettingsBtn.addEventListener("click", closeModal);

// Закриття модалки при кліку поза вікном
if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) closeModal();
    });
}

// Обробка вибору нової аватарки та конвертація в Base64
if (avatarInput) {
    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            base64Avatar = reader.result; // Отримуємо Base64 рядок зображення
            avatarPreview.src = base64Avatar; // Показуємо прев'ю
        };
        reader.readAsDataURL(file);
    });
}

// Збереження змін профілю в базі
if (editProfileForm) {
    editProfileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const updatedUsername = editUsername.value.trim();
        const updatedBio = editBio.value.trim();

        if (updatedUsername === "") {
            alert("Ім'я користувача не може бути порожнім!");
            return;
        }

        // Об'єкт оновлення даних
        const updates = {
            username: updatedUsername,
            bio: updatedBio
        };

        // Якщо користувач завантажив нову аватарку
        if (base64Avatar !== "") {
            updates.photoURL = base64Avatar;
        }

        // Записуємо зміни у Firebase Realtime Database
        update(ref(database, `users/${currentUser.uid}`), updates)
            .then(() => {
                alert("Профіль успішно оновлено!");
                closeModal();
            })
            .catch((error) => {
                console.error("Помилка оновлення профілю:", error);
                alert("Не вдалося зберегти зміни. Спробуйте ще раз.");
            });
    });
}

// ==========================================
// 3. ОБРОБКА НАВІГАЦІЇ
// ==========================================

// Кнопка назад (повернення на карту)
if (btnBack) {
    btnBack.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// Кнопка створення фото
if (btnCreate) {
    btnCreate.addEventListener("click", () => {
        window.location.href = "CreatePhoto.html";
    });
}

// Кнопка пошуку (можна додати перенаправлення за бажанням)
if (btnSearch) {
    btnSearch.addEventListener("click", () => {
        window.location.href = "index.html"; // Наприклад, повертає на головну і відкриває пошук
    });
}s