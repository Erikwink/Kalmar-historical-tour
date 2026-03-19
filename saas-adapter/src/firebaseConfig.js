// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
if (!apiKey) {
  console.error("[saas-adapter] Missing VITE_FIREBASE_API_KEY. Check this app's .env file.");
}

export default {
  apiKey,
  authDomain: "historical-walk-a5d3a.firebaseapp.com",
  databaseURL: "https://historical-walk-a5d3a-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "historical-walk-a5d3a",
  storageBucket: "historical-walk-a5d3a.firebasestorage.app",
  messagingSenderId: "726112215514",
  appId: "1:726112215514:web:7c08eef120587c216720e3",
  measurementId: "G-HT41K1J7LF"
}
