import { auth, database } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Елементи
const title = document.getElementById("title");
const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const password2 = document.getElementById("password2");
const mainButton = document.getElementById("mainButton");
const switchMode = document.getElementById("switchMode");
const switchText = document.getElementById("switchText");

// Режим
let registerMode = false;

// Перемикання між входом та реєстрацією
switchMode.addEventListener("click", () => {

    registerMode = !registerMode;

    if (registerMode) {
        title.textContent = "Реєстрація";
        username.style.display = "block";
        password2.style.display = "block";
        mainButton.textContent = "Зареєструватися";
        switchText.textContent = "Вже є акаунт?";
        switchMode.textContent = "Увійти";

    } else {
        title.textContent = "Вхід";
        username.style.display = "none";
        password2.style.display = "none";
        mainButton.textContent = "Увійти";
        switchText.textContent = "Немає акаунта?";
        switchMode.textContent = "Створити";
    }

});

// Натискання кнопки
mainButton.addEventListener("click", () => {

    const userEmail = email.value.trim();
    const userPassword = password.value;

    if (userEmail === "" || userPassword === "") {
        alert("Заповніть всі поля!");
        return;
    }

    // РЕЄСТРАЦІЯ

    if (registerMode) {
        if (username.value.trim() === "") {
            alert("Введіть ім'я!");
            return;
        }

        if (userPassword !== password2.value) {
            alert("Паролі не співпадають!");
            return;
        }

        createUserWithEmailAndPassword(auth, userEmail, userPassword)
            .then((userCredential) => {
                const user = userCredential.user;
                return set(ref(database, "users/" + user.uid), {
                    username: username.value,
                    email: userEmail,
                    createdAt: Date.now(),
                    photoURL: "",
                    bio: "",
                    photos: 0,
                    followers: 0,
                    following: 0
                });
            })

            .then(() => {
                alert("Акаунт успішно створено!");
                window.location.href = "index.html";
            })
            .catch((error) => {
                console.log(error);
                alert(error.message);
            });
    }

    // ВХІД

    else {
        signInWithEmailAndPassword(auth, userEmail, userPassword)

            .then(() => {
                window.location.href = "index.html";
            })

            .catch((error) => {
                console.log(error);
                alert(error.message);
            });
    }
});