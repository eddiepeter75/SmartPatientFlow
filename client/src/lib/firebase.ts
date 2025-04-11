import { initializeApp } from "firebase/app";
import { 
  getDatabase, 
  connectDatabaseEmulator, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  push, 
  remove,
  runTransaction
} from "firebase/database";
import { getAuth, signInAnonymously, connectAuthEmulator } from "firebase/auth";

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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Use Replit's environment to determine if we're in development
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Initialization function
export function initializeFirebase() {
  try {
    console.log("Initializing Firebase...");
    
    // Anonymous authentication
    signInAnonymously(auth)
      .then(() => console.log("Firebase: Signed in anonymously"))
      .catch(error => {
        console.error("Firebase: Auth error:", error);
      });
  } catch (error) {
    console.error("Firebase: Error initializing:", error);
  }
}

// Helper function for incrementing counter (similar to the transaction in app.js)
export async function incrementCounter(counterPath: string): Promise<number | null> {
  try {
    const counterRef = ref(db, counterPath);
    const result = await runTransaction(counterRef, (current) => {
      return (current || 0) + 1;
    });
    
    if (result.committed) {
      return result.snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Transaction failed:', error);
    return null;
  }
}

// Export Firebase database, auth and Firebase functions
export { 
  db, 
  auth, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  push, 
  remove, 
  runTransaction 
};
