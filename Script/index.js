const buttonCreate1 = document.querySelector(".button_create");
const buttonProfile = document.querySelector(".button_profile");


// Кнопка додавання фото
buttonCreate1.addEventListener("click", () => {
    window.location.href = "createPhoto.html";
});

// Кнопка профілю
buttonProfile.addEventListener("click", () => {
    window.location.href = "profile.html";
});

