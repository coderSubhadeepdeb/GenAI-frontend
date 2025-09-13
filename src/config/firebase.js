import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAdvH7B7Qxnde4n1ITNP-RChbdG-VFUW3I",
  authDomain: "bloom-final-471317.firebaseapp.com",
  projectId: "bloom-final-471317",
  storageBucket: "bloom-final-471317.firebasestorage.app",
  messagingSenderId: "577359325267",
  appId: "1:577359325267:web:7e4d9d788104d34ccdbea6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
