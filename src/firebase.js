// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4hciZz_3TA1E8wVxKWQRXZRF3kz8N4HY",
  authDomain: "pa-promo-dashboard.firebaseapp.com",
  databaseURL: "https://pa-promo-dashboard-default-rtdb.firebaseio.com",
  projectId: "pa-promo-dashboard",
  storageBucket: "pa-promo-dashboard.appspot.com",
  messagingSenderId: "949344958493",
  appId: "1:949344958493:web:9199f684adb5981f60eef4",
  measurementId: "G-5VBWQXKW6K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);