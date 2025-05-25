// src/api/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase web con las claves existentes
const firebaseConfig = {
  apiKey: "AIzaSyCeGZp5Pna87490Ns8Y_5kCtEjxw12VI2g",
  authDomain: "appja-b8f49.firebaseapp.com",
  projectId: "appja-b8f49",
  storageBucket: "appja-b8f49.firebasestorage.app",
  messagingSenderId: "276671305114",
  appId: "1:276671305114:web:121705036997ea74bc1623"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;