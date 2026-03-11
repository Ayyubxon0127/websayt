import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseCoreConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const app = hasFirebaseCoreConfig
  ? (getApps()[0] || initializeApp(firebaseConfig))
  : null;

export const firebaseEnabled = Boolean(app);
export const firebaseApp = app;
export const firebaseAuth = app ? getAuth(app) : null;
export const firebaseDb = app ? getFirestore(app) : null;
export const firebaseStorage = app ? getStorage(app) : null;

if (app) {
  console.log('%c✅ Firebase ulandi!', 'color: #4CAF50; font-weight: bold;', `Project: ${firebaseConfig.projectId}`);
} else {
  console.warn('⚠️ Firebase ulanmadi — .env faylida VITE_FIREBASE_* qiymatlarini tekshiring.');
}

export async function initFirebaseAnalytics() {
  if (!app || !firebaseConfig.measurementId) return null;
  if (!(await isSupported())) return null;
  return getAnalytics(app);
}
