import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCt7JCmc3SL9w_TvHWAXTbs6uPH1RVkbKE",
  authDomain: "queue-management-system-86aec.firebaseapp.com",
  databaseURL: "https://queue-management-system-86aec-default-rtdb.firebaseio.com",
  projectId: "queue-management-system-86aec",
  storageBucket: "queue-management-system-86aec.firebasestorage.app",
  messagingSenderId: "690840302833",
  appId: "1:690840302833:web:78c1cec75396c7be62e550",
  measurementId: "G-B3BBKQWSTN"
};

// Initialize Firebase
let app: any;
let db: any;
let auth: any;

export function initializeFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
    
    // Anonymous authentication
    signInAnonymously(auth)
      .then(() => console.log("Signed in anonymously"))
      .catch(error => {
        console.error("Auth error:", error);
      });
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Export Firebase database and auth
export { db, auth };
