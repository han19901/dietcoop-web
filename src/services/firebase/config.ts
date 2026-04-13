import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB6xpQUglZgS6ZMt2B2FRcDbtaLQ9KaWjE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "webdietcoop.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "webdietcoop",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "webdietcoop.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "553541325906",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:553541325906:web:e83855ea9bcd27abbbbb8b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9R9PJPJCJ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
// Popup ayarları - popup'ın otomatik kapanması için
auth.settings.appVerificationDisabledForTesting = false;
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics desteklenmiyorsa sessizce devam et
  });
}
export { analytics };

export default app;


