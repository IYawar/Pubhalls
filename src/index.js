// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6k6kkFmewfbdZnMRqBoVR7Tqrf0wglZo",
  authDomain: "pubhalls-b72ae.firebaseapp.com",
  projectId: "pubhalls-b72ae",
  storageBucket: "pubhalls-b72ae.appspot.com",
  messagingSenderId: "903879583838",
  appId: "1:903879583838:web:9f24f3c402d06280622ccf",
  measurementId: "G-XR68F92CDX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);