import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB9HOgUcdcPgLcLGBRqeFQ2NmNScp2uygU",
    authDomain: "agentic-healthcare-opd.firebaseapp.com",
    projectId: "agentic-healthcare-opd",
    storageBucket: "agentic-healthcare-opd.firebasestorage.app",
    messagingSenderId: "459137852030",
    appId: "1:459137852030:web:ed89955808ba48cfa1ae2f"
};

//  prevent duplicate app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

//  SIMPLE & STABLE AUTH (NO persistence config)
export const auth = getAuth(app);
export const db = getFirestore(app);