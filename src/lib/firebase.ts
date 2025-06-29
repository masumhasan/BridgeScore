import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDNFKX0y3B8M-HRqZNGjheMUgHWxX_c-6Y",
  authDomain: "bridgescore-app.firebaseapp.com",
  projectId: "bridgescore-app",
  storageBucket: "bridgescore-app.appspot.com",
  messagingSenderId: "1011165776209",
  appId: "1:1011165776209:web:3b652c6cdb2474a659eb70",
  measurementId: "G-Y0S06XLMXQ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
