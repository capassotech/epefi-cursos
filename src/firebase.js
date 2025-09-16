// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDmUUc9pf94sLVD0RRPW-t0j0zjYmfud7o",
  authDomain: "epefi-admin.firebaseapp.com",
  projectId: "epefi-admin",
  storageBucket: "epefi-admin.firebasestorage.app",
  messagingSenderId: "148104863138",
  appId: "1:148104863138:web:a90f184ad83e2b65db66fb",
  measurementId: "G-DJ6V3STCGZ",
};
// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la instancia de autenticación
export const auth = getAuth(app);

// Exporta la instancia de Realtime Database
export const database = getDatabase(app);
export const storage = getStorage(app);
