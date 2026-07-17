// Script/search.js

export function initSearch(map, markersMap) {
    const searchButton = document.querySelector(".button_search");
    if (!searchButton) return;

    // Створюємо інпут для пошуку динамічно, щоб не псувати ваш HTML
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Пошук за камерою, лінзою чи описом...";
    searchInput.className = "search-input-field";
    
    // Додаємо інпут на сторінку (всередину навігаційної панелі або поруч)
    const downbuttonPanel = document.querySelector(".downbutton");
    if (downbuttonPanel) {
        downbuttonPanel.appendChild(searchInput);
    }

    // Логіка показу/приховування інпуту при кліку на кнопку пошуку
    searchButton.addEventListener("click", (e) => {
        e.stopPropagation();
        searchInput.classList.toggle("active");
        if (searchInput.classList.contains("active")) {
            searchInput.focus();
        }
    });

    // Функція фільтрації
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();

        // Проходимося по всіх збережених маркерах
        markersMap.forEach((markerData) => {
            const { marker, photo } = markerData;
            
            // Дані для перевірки (переводимо в нижній регістр)
            const camera = (photo.camera || "").toLowerCase();
            const lens = (photo.lens || "").toLowerCase();
            const desc = (photo.description || "").toLowerCase();
            const author = (photo.username || "").toLowerCase();

            // Якщо запит порожній або є збіг хоча б в одному полі
            if (
                query === "" || 
                camera.includes(query) || 
                lens.includes(query) || 
                desc.includes(query) ||
                author.includes(query)
            ) {
                // Показуємо маркер, якщо його не було на карті
                if (!map.hasLayer(marker)) {
                    marker.addTo(map);
                }
            } else {
                // Ховаємо маркер з карти
                if (map.hasLayer(marker)) {
                    map.removeLayer(marker);
                }
            }
        });
    });

    // Клік повз інпут ховає його
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && e.target !== searchButton && !searchButton.contains(e.target)) {
            searchInput.classList.remove("active");
        }
    });
}