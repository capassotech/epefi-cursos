// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBYVbFkQ2no23REuOlixl3pr4dhBIijCwQ",
    authDomain: "epefi-cursos.firebaseapp.com",
    projectId: "epefi-cursos",
    storageBucket: "epefi-cursos.firebasestorage.app",
    messagingSenderId: "802081217440",
    appId: "1:802081217440:web:5529a15bdb280d8d57a2c5",
    measurementId: "G-RT024RQC4T"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la instancia de autenticación
export const auth = getAuth(app);

// Exporta la instancia de Realtime Database
export const database = getDatabase(app);
export const storage = getStorage(app);