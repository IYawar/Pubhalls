// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6_scOJqjMdh_mLupFTHtFHrUYh-N-Y2I",
  authDomain: "pubhalls-dn.firebaseapp.com",
  projectId: "pubhalls-dn",
  storageBucket: "pubhalls-dn.appspot.com",
  messagingSenderId: "168104522348",
  appId: "1:168104522348:web:8513413b9458986778de49",
  measurementId: "G-D18GJ06T9N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);