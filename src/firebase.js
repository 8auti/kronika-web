// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyUOL1BwhPUmKvUOiEulUxXM8aBmZdJrM",
  authDomain: "kronika-841bc.firebaseapp.com",
  projectId: "kronika-841bc",
  storageBucket: "kronika-841bc.firebasestorage.app",
  messagingSenderId: "246067714210",
  appId: "1:246067714210:web:4a6071c1f68d9bf0335ffb",
  measurementId: "G-9X5ZHDHPW5"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
