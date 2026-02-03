import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// REPLACE WITH YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "<YOUR_API_KEY_FROM_FIREBASE_CONSOLE>",
    authDomain: "velvetvines-6ba73.firebaseapp.com",
    databaseURL: "https://velvetvines-6ba73-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "velvetvines-6ba73",
    storageBucket: "velvetvines-6ba73.appspot.com",
    messagingSenderId: "105881596674",
    appId: "<YOUR_APP_ID_FROM_FIREBASE_CONSOLE>"

};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
