import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAGbzrLuqpua1fgwKY5QWcREijtAnq199I",
    authDomain: "photomap-8877c.firebaseapp.com",
    databaseURL: "https://photomap-8877c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "photomap-8877c",
    storageBucket: "photomap-8877c.firebasestorage.app",
    messagingSenderId: "619894936844",
    appId: "1:619894936844:web:80012e6c115a962dda6529"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const database = getDatabase(app);

export { app, auth, database };