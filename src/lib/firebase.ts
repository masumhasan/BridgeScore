import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDNFKX0y3B8M-HRqZNGjheMUgHWxX_c-6Y",
  authDomain: "bridgescore-app.firebaseapp.com",
  databaseURL: "https://bridgescore-app-default-rtdb.firebaseio.com",
  projectId: "bridgescore-app",
  storageBucket: "bridgescore-app.appspot.com",
  messagingSenderId: "1011165776209",
  appId: "1:1011165776209:web:a3d46c6f0f5c4bca59eb70",
  measurementId: "G-D42JPN6307"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
