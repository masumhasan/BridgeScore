import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDNFKX0y3B8M-HRqZNGjheMUgHWxX_c-6Y",
  authDomain: "bridgescore-app.firebaseapp.com",
  projectId: "bridgescore-app",
  storageBucket: "bridgescore-app.appspot.com",
  messagingSenderId: "1011165776209",
  appId: "1:1011165776209:web:e82e723cfd377da659eb70",
  measurementId: "G-3E242ZM778"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
