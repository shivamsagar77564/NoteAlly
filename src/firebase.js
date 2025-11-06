// src/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBGnCpGtakvgZ4w2w-Vl2AdpeHAdymg3JA",
  authDomain: "noteally-d6e60.firebaseapp.com",
  projectId: "noteally-d6e60",
  storageBucket: "noteally-d6e60.firebasestorage.app",
  messagingSenderId: "43352822020",
  appId: "1:43352822020:web:068a923f229b89c1794051",
  measurementId: "G-3BYT8H7RE2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
