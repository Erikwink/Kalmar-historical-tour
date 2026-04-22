// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
if (!apiKey) {
  console.error("[saas-adapter] Missing VITE_FIREBASE_API_KEY. Check this app's .env file.");
}

export default{
  apiKey,
  authDomain: "kalmar-historical-tour.firebaseapp.com",
  databaseURL: "https://kalmar-historical-tour-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "kalmar-historical-tour",
  storageBucket: "kalmar-historical-tour.firebasestorage.app",
  messagingSenderId: "740080561500",
  appId: "1:740080561500:web:99a32caea5423fe7be2599",
  measurementId: "G-H9JWC8WT64"
};